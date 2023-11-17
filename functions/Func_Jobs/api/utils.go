package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
	"github.com/crowdstrike/gofalcon/falcon/client/custom_storage"
	"github.com/crowdstrike/gofalcon/falcon/client/hosts"
	"github.com/crowdstrike/gofalcon/falcon/client/workflows"
	model "github.com/crowdstrike/gofalcon/falcon/models"
	"github.com/go-openapi/runtime"
)

const (
	JobCreated ActionTaken = "Created"
	JobEdited  ActionTaken = "Updated"

	deviceHostGroups = "groups"
)

// ActionTaken enumerates the list of action taken on job
type ActionTaken string

func auditLogProducer(ctx context.Context, event ActionTaken, req *models.Job, conf *models.Config, fc *client.CrowdStrikeAPISpecification) []fdk.APIError {
	var errs []fdk.APIError
	logId := fmt.Sprintf("%d%s", time.Now().UnixNano(), req.ID)

	customJobRequest := custom_storage.NewPutObjectParamsWithContext(ctx)
	customJobRequest.SetObjectKey(logId)
	customJobRequest.SetCollectionName(conf.AuditLogsCollection)

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

func putJob(ctx context.Context, req *models.Job, conf *models.Config, fc *client.CrowdStrikeAPISpecification) (string, []fdk.APIError) {
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
	customJobRequest.SetCollectionName(conf.JobsCollection)

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

func jobInfo(ctx context.Context, id string, conf *models.Config, fc *client.CrowdStrikeAPISpecification) (*models.Job, []fdk.APIError) {
	var errs []fdk.APIError

	customJobRequest := custom_storage.NewGetObjectParamsWithContext(ctx)
	customJobRequest.SetObjectKey(id)
	customJobRequest.SetCollectionName(conf.JobsCollection)

	buf := new(bytes.Buffer)
	_, err := fc.CustomStorage.GetObject(customJobRequest, buf)
	if err != nil {
		runtimeErr := err.(*runtime.APIError)
		return nil, []fdk.APIError{{
			Code:    runtimeErr.Code,
			Message: err.Error(),
		}}
	}
	rawResponse, err := io.ReadAll(buf)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	var result models.Job
	err = json.Unmarshal(rawResponse, &result)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	return &result, errs
}

func search(ctx context.Context, req models.SearchObjectsRequest, fc *client.CrowdStrikeAPISpecification) (models.SearchObjectsResponse, []fdk.APIError) {
	limit := 100
	if req.Limit > 0 {
		limit = req.Limit
	}
	var sort *string
	if req.Sort != "" {
		sort = &req.Sort
	}
	offset := 0
	if req.Offset > 0 {
		offset = req.Offset
	}
	params := custom_storage.SearchObjectsParams{
		CollectionName: req.Collection,
		Context:        ctx,
		Filter:         req.Filter,
		Limit:          int64(limit),
		Offset:         int64(offset),
		Sort:           sort,
	}
	resp, err := fc.CustomStorage.SearchObjects(&params)
	if err != nil {
		return models.SearchObjectsResponse{}, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	payload := resp.GetPayload()
	if len(payload.Errors) > 0 {
		errs := convertMsaErrorsToAPIErrors(resp.GetPayload().Errors)
		return models.SearchObjectsResponse{}, errs
	}

	sor := models.SearchObjectsResponse{}
	if pagination := payload.Meta.Pagination; pagination != nil {
		sor.Total = int64PAsInt(pagination.Total)
		sor.Offset = int32PAsInt(pagination.Offset)
	}
	res := payload.Resources
	if len(res) == 0 {
		return sor, nil
	}
	sor.ObjectKeys = make([]string, len(res))
	for i, r := range res {
		sor.ObjectKeys[i] = asString(r.ObjectKey)
	}
	return sor, nil
}

func auditInfo(ctx context.Context, id string, conf *models.Config, fc *client.CrowdStrikeAPISpecification) (*models.Audit, []fdk.APIError) {
	var errs []fdk.APIError

	customJobRequest := custom_storage.NewGetObjectParamsWithContext(ctx)
	customJobRequest.SetObjectKey(id)
	customJobRequest.SetCollectionName(conf.AuditLogsCollection)

	buf := new(bytes.Buffer)
	_, err := fc.CustomStorage.GetObject(customJobRequest, buf)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	rawResponse, err := io.ReadAll(buf)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	var result models.Audit
	err = json.Unmarshal(rawResponse, &result)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		}}
	}

	return &result, errs
}

func provisionWorkflowForExec(ctx context.Context, req *models.Job, conf *models.Config, workflowID string, fc *client.CrowdStrikeAPISpecification) (string, []fdk.APIError) {
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

func provisionWorkflowWithAct(ctx context.Context, req *models.Job, conf *models.Config, fc *client.CrowdStrikeAPISpecification) (string, []fdk.APIError) {
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

func convertMsaErrorsToAPIErrors(msaAPIErrors []*model.MsaAPIError) []fdk.APIError {
	var errs []fdk.APIError
	for _, e := range msaAPIErrors {
		code := http.StatusInternalServerError
		message := ""
		if e.Code != nil {
			code = int(*e.Code)
		}

		if e.Message != nil {
			message = *e.Message
		}
		errs = append(errs, fdk.APIError{
			Code:    code,
			Message: message,
		})
	}
	return errs
}

func updateSchedule(req *models.Job) *models.Schedule {
	schedule := models.Schedule{}
	loc, _ := time.LoadLocation("UTC")
	if req.Schedule != nil && req.Schedule.Timezone != "" {
		loc, _ = time.LoadLocation(req.Schedule.Timezone)
	}

	if req.RunNow {
		if req.Schedule == nil {
			req.Schedule = &models.Schedule{}
		}
		startTime := time.Now().In(loc)
		currTime := startTime.Add(2 * time.Minute)
		endTime := currTime.AddDate(0, 0, 1)

		req.Schedule.Start = startTime.Format(time.RFC3339)
		req.Schedule.End = endTime.Format(time.RFC3339)
		req.Schedule.TimeCycle = fmt.Sprintf(models.RunNowTimeCyclesFormat, currTime.Minute(), currTime.Hour())
		req.Schedule.SkipConcurrent = false
	} else if req.Schedule != nil && req.Schedule.TimeCycle == "" {
		startTime, _ := time.Parse(time.RFC3339, req.Schedule.Start)
		if req.Schedule.End == "" {
			req.Schedule.End = startTime.AddDate(0, 0, 1).Format(time.RFC3339)
		}
		req.Schedule.TimeCycle = fmt.Sprintf(models.RunNowTimeCyclesFormat, startTime.Minute(), startTime.Hour())
	}
	req.Schedule.Timezone = loc.String()
	if len(req.Schedule.Start) > 0 {
		strttime, _ := time.Parse(time.RFC3339, req.Schedule.Start)
		schedule.Start = fmt.Sprintf(models.DateFormat, strttime.Month(), strttime.Day(), strttime.Year())
	}

	if len(req.Schedule.End) > 0 {
		endTime, _ := time.Parse(time.RFC3339, req.Schedule.End)
		schedule.End = fmt.Sprintf(models.DateFormat, endTime.Month(), endTime.Day(), endTime.Year())
	}

	schedule.TimeCycle = req.Schedule.TimeCycle
	schedule.Timezone = req.Schedule.Timezone
	schedule.SkipConcurrent = false

	return &schedule
}

func asString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func int64PAsInt(i *int64) int {
	if i == nil {
		return 0
	}
	return int(*i)
}

func int32PAsInt(i *int32) int {
	if i == nil {
		return 0
	}
	return int(*i)
}
