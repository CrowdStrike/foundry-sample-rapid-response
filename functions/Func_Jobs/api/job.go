package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func handleSaveJobVersion(ctx context.Context, r fdk.Request) fdk.Response {
	const queryIDParam = "id"
	queryParams := r.Params.Query[queryIDParam]
	if len(queryParams) != 1 {
		return fdk.ErrResp(fdk.APIError{Code: http.StatusBadRequest, Message: fmt.Sprintf("query params %s length: %d is incorrect", queryIDParam, len(queryParams))})
	}

	job, errs := saveJob(ctx, queryParams[0], getFalconClient(ctx))
	if len(errs) != 0 {
		response := fdk.ErrResp(errs...)
		if strings.Contains(errs[0].Message, "not found") {
			response.Code = http.StatusNotFound
		}
		return response
	}

	return fdk.Response{Code: http.StatusOK, Body: fdk.JSON(job)}
}

// saveJob saves a job to custom storage and may attempt to run or schedule the job if requested.
func saveJob(ctx context.Context, id string, fc *client.CrowdStrikeAPISpecification) (*models.JobResponse, []fdk.APIError) {
	job, errs := jobInfo(ctx, id, fc)
	if len(errs) != 0 {
		return nil, errs
	}
	return &models.JobResponse{Resource: job}, nil
}
