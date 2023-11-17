package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

const queryIDParam = "id"

// JobHandler executes a given request to the FaaS function.
type JobHandler struct {
	conf *models.Config
}

// NewJobHandler returns an initialized version of JobHandler.
func NewJobHandler(conf *models.Config) *JobHandler {
	return &JobHandler{
		conf: conf,
	}
}

func (h *JobHandler) Handle(ctx context.Context, request fdk.Request) fdk.Response {
	response := fdk.Response{}
	if request.Params.Query == nil {
		response.Code = http.StatusBadRequest
		response.Errors = append(response.Errors, fdk.APIError{Code: http.StatusBadRequest, Message: "Request does not have query params"})
		return response
	}

	queryParams := request.Params.Query[queryIDParam]
	if len(queryParams) != 1 {
		response.Code = http.StatusBadRequest
		response.Errors = append(response.Errors, fdk.APIError{Code: http.StatusBadRequest, Message: fmt.Sprintf("query params %s length: %d is incorrect", queryIDParam, len(queryIDParam))})
		return response
	}

	fc, err := models.FalconClient(ctx, h.conf, request)
	if err != nil {
		response.Code = http.StatusInternalServerError
		response.Errors = append(response.Errors, fdk.APIError{Code: http.StatusBadRequest, Message: "fail to initialize client"})
		return response
	}

	job, errs := h.job(ctx, queryParams[0], fc)
	if len(errs) != 0 {
		if strings.Contains(errs[0].Message, "not found") {
			response.Code = http.StatusNotFound
		}
		response.Errors = append(response.Errors, errs...)
		return response
	}

	body, err := json.Marshal(job)
	if err != nil {
		response = fdk.Response{
			Code: http.StatusInternalServerError,
			Errors: []fdk.APIError{
				{Code: http.StatusInternalServerError, Message: "failed marshalling response body"},
			},
		}
		return response
	}

	response.Body = json.RawMessage(body)
	response.Code = http.StatusOK

	return response
}

// job saves a job to custom storage and may attempt to run or schedule the job if requested.
func (h *JobHandler) job(ctx context.Context, id string, fc *client.CrowdStrikeAPISpecification) (*models.JobResponse, []fdk.APIError) {
	job, errs := jobInfo(ctx, id, h.conf, fc)
	if len(errs) != 0 {
		return nil, errs
	}
	result := models.JobResponse{
		Resource: *job,
	}
	return &result, nil
}
