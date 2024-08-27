package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
	"github.com/crowdstrike/gofalcon/falcon/client/custom_storage"
	"github.com/crowdstrike/gofalcon/falcon/client/hosts"
	"github.com/crowdstrike/gofalcon/falcon/client/workflows"
	model "github.com/crowdstrike/gofalcon/falcon/models"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

const (
	JobCreated ActionTaken = "Created"
	JobEdited  ActionTaken = "Updated"

	deviceHostGroups = "groups"
)

// ActionTaken enumerates the list of action taken on job
type ActionTaken string

func handleUpsertJob(conf models.Config) fdk.Handler {
	return fdk.HandleFnOf(func(ctx context.Context, r fdk.RequestOf[models.UpsertJobRequest]) fdk.Response {
		isDraft := r.Params.Query.Get("draft") == "true"
		var req models.UpsertJobRequest

		result, errs := upsertJob(ctx, conf, isDraft, &req, getFalconClient(ctx))
		if len(errs) != 0 {
			return fdk.ErrResp(errs...)
		}

		return fdk.Response{Code: http.StatusOK, Body: fdk.JSON(result)}
	})
}

// upsertJob saves a job to custom storage and may attempt to run or schedule the job if requested.
func upsertJob(ctx context.Context, conf models.Config, isDraft bool, req *models.UpsertJobRequest, fc *client.CrowdStrikeAPISpecification) (*models.UpsertJobResponse, []fdk.APIError) {
	var errs []fdk.APIError
	var err error

	validationErr := req.Validate()
	if len(validationErr) != 0 {
		return nil, validationErr
	}

	id := req.ID
	if id == "" {
		id, err = models.GenerateID(req.Name)
		if err != nil {
			return nil, []fdk.APIError{models.NewAPIError(http.StatusInternalServerError, fmt.Sprintf("failed to generate id for job: %s with err: %v", req.Name, err))}
		}

		_, errs := jobInfo(ctx, id, fc)
		if len(errs) == 0 {
			return nil, append(validationErr, fdk.APIError{
				Code:    http.StatusBadRequest,
				Message: fmt.Sprintf("job with name:%s already exist", req.Name),
			})
		}
		if errs[0].Code != http.StatusNotFound {
			return nil, errs
		}
	}

	decorateErr := decorateRequest(ctx, conf, isDraft, id, &req.Job, fc)
	if len(decorateErr) != 0 {
		return nil, append(validationErr, decorateErr...)
	}

	// create the object in the custom_storage.
	jobID, errs := putJob(ctx, &req.Job, fc)
	if len(errs) != 0 {
		validationErr = append(validationErr, errs...)
		return nil, validationErr
	}

	action := JobEdited
	if req.Version == 1 {
		action = JobCreated
	}

	errs = auditLogProducer(ctx, action, &req.Job, fc)
	if len(errs) != 0 {
		// we do not rollback transaction if auditlogger fails
		validationErr = append(validationErr, errs...)
		return nil, validationErr
	}

	return &models.UpsertJobResponse{Resource: jobID}, nil
}

func decorateRequest(ctx context.Context, conf models.Config, isDraft bool, id string, req *models.Job, fc *client.CrowdStrikeAPISpecification) []fdk.APIError {
	if !isDraft {
		req.WSchedule = updateSchedule(req)

		recurrences := 0
		nextRun, errNxt := models.NextRun(req.Schedule, time.Now().UTC())
		if errNxt != nil {
			err := models.NewAPIError(http.StatusInternalServerError, fmt.Sprintf("failed to get the next run time err: %v", errNxt))
			return []fdk.APIError{err}
		}

		if req.Schedule.End == "" {
			recurrences = math.MaxInt
		}

		for {
			if recurrences == math.MaxInt || !isNextRunValid(nextRun, req.Schedule.Start, req.Schedule.End) {
				break
			}
			recurrences++
			nextRun, errNxt = models.NextRun(req.Schedule, nextRun)
		}

		req.TotalRecurrences = recurrences
		workflowId, errs := provisionWorkflowWithAct(ctx, req, conf, fc)
		if len(errs) != 0 {
			return errs
		}

		executionWorkflowID, errs := provisionWorkflowForExec(ctx, req, conf, workflowId, fc)
		if len(errs) != 0 {
			return errs
		}

		req.Workflows = &models.WorkflowsInfo{ScheduleWorkflow: workflowId, NotifierWorkflow: executionWorkflowID}
		req.NextRun = &nextRun
	}

	currTime := time.Now()
	version := req.Version + 1
	if version == 1 {
		req.CreatedAt = &currTime
	}
	req.ID = id
	req.Version = version
	req.UpdatedAt = &currTime
	req.Draft = isDraft

	var errs []fdk.APIError
	req.HostCount = len(req.Target.Hosts)

	if len(req.Target.HostGroups) != 0 {
		req.HostCount, errs = getDeviceCountForHostGroup(ctx, req.Target.HostGroups, fc)
		if len(errs) != 0 {
			return errs
		}
	}

	return errs
}

func auditLogProducer(ctx context.Context, event ActionTaken, req *models.Job, fc *client.CrowdStrikeAPISpecification) []fdk.APIError {
	var errs []fdk.APIError
	logId := fmt.Sprintf("%d%s", time.Now().UnixNano(), req.ID)

	customJobRequest := custom_storage.NewPutObjectParamsWithContext(ctx)
	customJobRequest.SetObjectKey(logId)
	customJobRequest.SetCollectionName(collectionAudit)

	auditLogsBody := models.Audit{
		JobName:    req.Name,
		ModifiedAt: req.UpdatedAt,
		Version:    req.Version,
		ModifiedBy: req.UserName,
		Action:     string(event),
		JobID:      req.ID,
		ID:         logId,
	}

	rawObject, err := json.Marshal(auditLogsBody)
	if err != nil {
		return []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}
	obj := io.NopCloser(bytes.NewReader(rawObject))
	customJobRequest.SetBody(obj)

	_, err = fc.CustomStorage.PutObject(customJobRequest)
	if err != nil {
		return []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	return errs
}

func provisionWorkflowWithAct(ctx context.Context, req *models.Job, conf models.Config, fc *client.CrowdStrikeAPISpecification) (string, []fdk.APIError) {
	var errs []fdk.APIError
	triggerNodeID := "trigger"
	reqBody := &model.ClientSystemDefinitionProvisionRequest{}
	reqBody.Name = &req.Name
	reqBody.Parameters = &model.ParameterTemplateProvisionParameters{}
	reqBody.Parameters.Trigger = &model.ParameterTriggerProvisionParameter{}
	reqBody.Parameters.Activities = &model.ParameterActivityProvisionParameters{}
	schedule := map[string]interface{}{
		"time_cycle":      req.WSchedule.TimeCycle,
		"tz":              req.WSchedule.Timezone,
		"skip_concurrent": false,
	}
	if len(req.WSchedule.Start) > 0 {
		schedule["start_date"] = req.WSchedule.Start
	}
	if len(req.WSchedule.End) > 0 {
		schedule["end_date"] = req.WSchedule.End
	}
	scheduleParams := model.ParameterTriggerFieldParameter{
		Properties: schedule,
	}
	reqBody.Parameters.Trigger.NodeID = &triggerNodeID
	reqBody.Parameters.Trigger.Fields = make(map[string]model.ParameterTriggerFieldParameter)
	reqBody.Parameters.Trigger.Fields["timer_event_definition"] = scheduleParams

	conditionForHostAndGroupsName := model.ParameterConditionProvisionParameter{
		Fields: []*model.ParameterConditionFieldProvisionParameter{},
	}

	switch req.Action.Type {
	case models.RemoveFile:
		removeNodeID := "remove_file_rtr_2_65337911"
		removeFile := model.ParameterActivityConfigProvisionParameter{
			NodeID: &removeNodeID,
			Properties: map[string]interface{}{
				"filePath": fmt.Sprintf("%s\\%s", req.Action.RemoveFileAction.RemoveFilePath, req.Action.RemoveFileAction.RemoveFileName),
			},
		}
		reqBody.Parameters.Activities.Configuration = append(reqBody.Parameters.Activities.Configuration, &removeFile)

		checkFileExistNodeID := "check_file_exist_rtr_2_e7dcae9e"
		checkFileExist := model.ParameterActivityConfigProvisionParameter{
			NodeID: &checkFileExistNodeID,
			Properties: map[string]interface{}{
				"filePath": fmt.Sprintf("%s\\%s", req.Action.RemoveFileAction.RemoveFilePath, req.Action.RemoveFileAction.RemoveFileName),
			},
		}

		conditionForHostAndGroupsName.NodeID = &conf.RemoveConditionNodeID

		reqBody.Parameters.Activities.Configuration = append(reqBody.Parameters.Activities.Configuration, &checkFileExist)
		reqBody.TemplateName = &conf.RemoveSystemWorkflowTemplateID

	case models.InstallSoftware:
		installNodeID := "put_and_run_file_b3305a8e"
		installSoft := model.ParameterActivityConfigProvisionParameter{
			NodeID: &installNodeID,
			Properties: map[string]interface{}{
				"file_name": req.Action.InstallSoftwareAction.FileName,
				"params":    req.Action.InstallSoftwareAction.CommandSwitch,
			},
		}

		conditionForHostAndGroupsName.NodeID = &conf.InstallConditionNodeID

		reqBody.Parameters.Activities.Configuration = append(reqBody.Parameters.Activities.Configuration, &installSoft)
		reqBody.TemplateName = &conf.InstallSystemWorkflowTemplateID

	default:
		return "", []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: fmt.Sprintf("Handle type is incorrect %s", req.Action.Type.String()),
		}}
	}

	op := "IN"
	opNotIN := "NOT_IN"
	hostNameField := "device_query_d360b503.Device.query.devices.#"
	groupNameField := "get_device_details_e84112c6.Device.GetDetails.Groups"

	hostNameCondition := &model.ParameterConditionFieldProvisionParameter{
		Name:  &hostNameField,
		Value: req.Target.Hosts,
	}
	groupNameCondition := &model.ParameterConditionFieldProvisionParameter{
		Name:  &groupNameField,
		Value: req.Target.HostGroups,
	}

	if len(req.Target.Hosts) != 0 {
		hostNameCondition.Operator = &op
		groupNameCondition.Operator = &opNotIN
		groupNameCondition.Value = []string{"undefined"}
	} else {
		hostNameCondition.Operator = &opNotIN
		groupNameCondition.Operator = &op
		hostNameCondition.Value = []string{"undefined"}
	}

	conditionForHostAndGroupsName.Fields = append(conditionForHostAndGroupsName.Fields, hostNameCondition, groupNameCondition)
	reqBody.Parameters.Conditions = append(reqBody.Parameters.Conditions, &conditionForHostAndGroupsName)

	provisionReq := workflows.NewProvisionSystemDefinitionParams()
	provisionReq.SetBody(reqBody)
	provisionReq.SetContext(ctx)
	resp, err := fc.Workflows.ProvisionSystemDefinition(provisionReq)
	if err != nil {
		return "", []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}
	if len(resp.GetPayload().Errors) != 0 {
		errs = convertMsaErrorsToAPIErrors(resp.GetPayload().Errors)
		return "", errs
	}
	if len(resp.GetPayload().Resources) == 0 {
		return "", []fdk.APIError{
			{
				Code:    2001,
				Message: fmt.Sprintf("resources from workflow is 0 response:%v", resp),
			},
		}
	}
	workflowID := resp.GetPayload().Resources[0]
	return workflowID, errs
}

func provisionWorkflowForExec(ctx context.Context, req *models.Job, conf models.Config, workflowID string, fc *client.CrowdStrikeAPISpecification) (string, []fdk.APIError) {
	var errs []fdk.APIError
	conditionNodeID := "flow_FROM_workflow_execution_id_is_equal_to_parameterized_6eb5201d_TO_activity_update_job_history_63aa1ffe"
	op := "EQ"
	propName := "Trigger.Category.WorkflowExecution.DefinitionID"

	reqBody := &model.ClientSystemDefinitionProvisionRequest{}
	reqBody.Name = &req.Name
	reqBody.TemplateName = &conf.ExecutionNotifierWorkflow
	reqBody.Parameters = &model.ParameterTemplateProvisionParameters{}

	reqBody.Parameters.Conditions = []*model.ParameterConditionProvisionParameter{
		{
			NodeID: &conditionNodeID,
			Fields: []*model.ParameterConditionFieldProvisionParameter{
				{
					Name:     &propName,
					Operator: &op,
					Value:    workflowID,
				},
			},
		},
	}

	emailNodeID := "activity_send_email_c6dbab17"
	emailNotification := model.ParameterActivityConfigProvisionParameter{
		NodeID: &emailNodeID,
		Properties: map[string]interface{}{
			"to": req.Notifications,
		},
	}
	reqBody.Parameters.Activities = &model.ParameterActivityProvisionParameters{}
	reqBody.Parameters.Activities.Configuration = append(reqBody.Parameters.Activities.Configuration, &emailNotification)

	provisionReq := workflows.NewProvisionSystemDefinitionParams()
	provisionReq.SetBody(reqBody)
	provisionReq.Context = ctx

	resp, err := fc.Workflows.ProvisionSystemDefinition(provisionReq)
	if err != nil {
		return "", []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	if len(resp.GetPayload().Errors) != 0 {
		errs = convertMsaErrorsToAPIErrors(resp.GetPayload().Errors)
		return "", errs
	}

	return resp.GetPayload().Resources[0], errs
}

func putJob(ctx context.Context, req *models.Job, fc *client.CrowdStrikeAPISpecification) (string, []fdk.APIError) {
	var errs []fdk.APIError
	rawObject, err := json.Marshal(req)
	if err != nil {
		return "", []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	customJobRequest := custom_storage.NewPutObjectParamsWithContext(ctx)
	customJobRequest.SetObjectKey(req.ID)
	customJobRequest.SetCollectionName(collectionJobs)

	obj := io.NopCloser(bytes.NewReader(rawObject))
	customJobRequest.SetBody(obj)

	response, err := fc.CustomStorage.PutObject(customJobRequest)
	if err != nil {
		return "", []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	if len(response.GetPayload().Errors) > 0 {
		errs = convertMsaErrorsToAPIErrors(response.GetPayload().Errors)
		return "", errs
	}

	if response.GetPayload().Resources[0].ObjectKey == nil {
		return "", []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: "failed to upsert the job. key is empty in the response",
		}}
	}

	return *response.GetPayload().Resources[0].ObjectKey, errs
}

func getDeviceCountForHostGroup(ctx context.Context, hostgroups []string, fc *client.CrowdStrikeAPISpecification) (int, []fdk.APIError) {
	var fqlStrings []string
	for _, grp := range hostgroups {
		fqlStrings = append(fqlStrings, fmt.Sprintf("%s:'%s'", deviceHostGroups, grp))
	}

	fqlAnd := ","
	fql := strings.Join(fqlStrings, fqlAnd)

	reqBody := hosts.NewQueryDevicesByFilterParamsWithContext(ctx)
	reqBody.SetFilter(&fql)
	resp, err := fc.Hosts.QueryDevicesByFilter(reqBody)
	if err != nil {
		return 0, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	if len(resp.GetPayload().Errors) != 0 {
		errs := convertMsaErrorsToAPIErrors(resp.GetPayload().Errors)
		return 0, errs
	}

	return len(resp.GetPayload().Resources), nil
}

// isNextRunValid check to see if next run is valid.  It has to be previousRun< Nextrun also start_time<nextrun<endtime, if so insert the next run
func isNextRunValid(nextTime time.Time, startTime, endTime string) bool {
	start, _ := time.Parse(time.RFC3339, startTime)
	end, _ := time.Parse(time.RFC3339, endTime)

	check := false
	if nextTime.After(start) || nextTime.Equal(end) {
		check = true
	}

	if !end.IsZero() {
		if nextTime.After(end) {
			check = false
		}
	}

	return check
}
