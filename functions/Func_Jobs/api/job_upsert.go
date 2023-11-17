package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

const queryIsDraft = "draft"

// UpsertJobHandler executes a given request to the FaaS function.
type UpsertJobHandler struct {
	conf *models.Config
}

// NewUpsertJobHandler returns a new instance of UpsertJobHandler.
func NewUpsertJobHandler(conf *models.Config) *UpsertJobHandler {
	return &UpsertJobHandler{
		conf: conf,
	}
}

func (h *UpsertJobHandler) Handle(ctx context.Context, request fdk.Request) fdk.Response {
	response := fdk.Response{}
	var isDraft bool

	var req models.UpsertJobRequest
	var errs []fdk.APIError

	err := json.Unmarshal(request.Body, &req)
	if err != nil {
		response.Code = http.StatusBadRequest
		response.Errors = append(response.Errors, models.NewAPIError(http.StatusBadRequest, fmt.Sprintf("Failed to unmarshal Request body err: %v.", err)))
		return response
	}

	queryParams := request.Params.Query.Get(queryIsDraft)
	if queryParams == "true" {
		isDraft = true
	}

	fc, err := models.FalconClient(ctx, h.conf, request)
	if err != nil {
		response.Code = http.StatusInternalServerError
		response.Errors = append(response.Errors, fdk.APIError{Code: http.StatusBadRequest, Message: "fail to initialize client"})
		return response
	}

	result, errs := h.upsertJob(ctx, isDraft, &req, fc)
	if len(errs) != 0 {
		response.Code = http.StatusInternalServerError
		response.Errors = errs
		return response
	}

	body, err := json.Marshal(result)
	if err != nil {
		response.Code = http.StatusInternalServerError
		response.Errors = append(response.Errors, models.NewAPIError(http.StatusInternalServerError, fmt.Sprintf("failed to marshal the response body with err: %v", err)))
		return response
	}

	response.Body = json.RawMessage(body)
	response.Code = http.StatusOK
	return response
}

// upsertJob saves a job to custom storage and may attempt to run or schedule the job if requested.
func (h *UpsertJobHandler) upsertJob(ctx context.Context, isDraft bool, req *models.UpsertJobRequest, fc *client.CrowdStrikeAPISpecification) (*models.UpsertJobResponse, []fdk.APIError) {
	var errs []fdk.APIError
	var err error

	validationErr := req.Validate()
	if len(validationErr) != 0 {
		return nil, validationErr
	}

	id := req.ID
	start := time.Now()
	startEndTOEnd := time.Now()

	if id == "" {
		id, err = models.GenerateID(req.Name)
		if err != nil {
			validationErr = append(validationErr, models.NewAPIError(http.StatusInternalServerError, fmt.Sprintf("failed to generate id for job: %s with err: %v", req.Name, err)))
			return nil, validationErr
		}
		prevJob, errs := jobInfo(ctx, id, h.conf, fc)
		if len(errs) != 0 {
			if errs[0].Code != http.StatusNotFound {
				validationErr = append(validationErr, errs...)
				return nil, errs
			}
		}
		if prevJob != nil {
			validationErr = append(validationErr, fdk.APIError{
				Code:    http.StatusBadRequest,
				Message: fmt.Sprintf("job with name:%s already exist", req.Name),
			})
			return nil, validationErr
		}
		elapsed := time.Since(start).Seconds()
		log.Println("time elasped get job id ", elapsed)
	}

	decorateErr := h.decorateRequest(ctx, isDraft, id, &req.Job, fc)
	if len(decorateErr) != 0 {
		validationErr = append(validationErr, decorateErr...)
		return nil, validationErr
	}

	start = time.Now()

	// create the object in the custom_storage.
	jobID, errs := putJob(ctx, &req.Job, h.conf, fc)
	if len(errs) != 0 {
		validationErr = append(validationErr, errs...)
		return nil, validationErr
	}

	elapsed := time.Since(start).Seconds()
	log.Println("time elasped upsert job id ", elapsed)
	start = time.Now()

	action := JobEdited
	if req.Version == 1 {
		action = JobCreated
	}

	errs = auditLogProducer(ctx, action, &req.Job, h.conf, fc)
	if len(errs) != 0 {
		// we do not rollback transaction if auditlogger fails
		validationErr = append(validationErr, errs...)
		return nil, validationErr
	}

	elapsed = time.Since(start).Seconds()
	log.Println("time elasped audit job id ", elapsed)

	elapsed = time.Since(startEndTOEnd).Seconds()
	log.Println("total time ", elapsed)

	return &models.UpsertJobResponse{Resource: jobID}, nil
}

func (h *UpsertJobHandler) decorateRequest(ctx context.Context, isDraft bool, id string, req *models.Job, fc *client.CrowdStrikeAPISpecification) []fdk.APIError {
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
		workflowId, errs := provisionWorkflowWithAct(ctx, req, h.conf, fc)
		if len(errs) != 0 {
			return errs
		}

		executionWorkflowID, errs := provisionWorkflowForExec(ctx, req, h.conf, workflowId, fc)
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
