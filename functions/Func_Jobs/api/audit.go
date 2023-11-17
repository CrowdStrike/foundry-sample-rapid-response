package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

// AuditsHandler executes a given request to the FaaS function.
type AuditsHandler struct {
	conf *models.Config
}

// NewAuditsHandler returns an initialized instance of the AuditsHandler.
func NewAuditsHandler(conf *models.Config) *AuditsHandler {
	return &AuditsHandler{
		conf: conf,
	}
}

func (h *AuditsHandler) Handle(ctx context.Context, request fdk.Request) fdk.Response {
	response := fdk.Response{}
	var err error

	fc, err := models.FalconClient(ctx, h.conf, request)
	if err != nil {
		response.Code = http.StatusInternalServerError
		response.Errors = append(response.Errors, fdk.APIError{Code: http.StatusBadRequest, Message: "fail to initialize client"})
		return response
	}

	audits, errs := h.auditDetails(ctx, &request, fc)
	if len(errs) != 0 {
		response.Code = http.StatusInternalServerError
		response.Errors = errs
		return response
	}

	body, err := json.Marshal(audits)
	if err != nil {
		response.Code = http.StatusInternalServerError
		response.Errors = []fdk.APIError{models.NewAPIError(http.StatusInternalServerError, fmt.Sprintf("failed to marshal the response body with err:%v", err))}
		return response
	}
	response.Body = json.RawMessage(body)
	response.Code = http.StatusOK
	return response
}

// jobInfo gets all the jobs for the app.
func (h *AuditsHandler) auditDetails(ctx context.Context, request *fdk.Request, fc *client.CrowdStrikeAPISpecification) (*models.AuditResponse, []fdk.APIError) {
	// Default limit set to 10
	limit := 10
	var response models.AuditResponse
	var errs []fdk.APIError
	var err error

	response.Resources = make([]models.Audit, 0)
	response.Meta = &models.Paging{
		Limit: limit,
	}

	limitParam := request.Params.Query.Get(queryLimit)
	if limitParam != "" {
		limit, err = strconv.Atoi(limitParam)
		if err != nil {
			return &response, []fdk.APIError{{
				Code:    http.StatusBadRequest,
				Message: fmt.Sprintf("limit is not an integer: %v", err),
			}}

		}
	}

	nOffset := request.Params.Query.Get(queryPrevOffset)
	qOffset := request.Params.Query.Get(queryNextOffset)
	filter := request.Params.Query.Get(queryParamFilter)

	if filter != "" {
		pair := strings.Split(filter, ":")
		key := pair[0]
		if key != "job_id" {
			return &response, []fdk.APIError{{
				Code:    http.StatusBadRequest,
				Message: fmt.Sprintf("filter is incorrect: %s. it needs job_id", filter),
			}}
		}
		filter = pair[1]
	}

	if qOffset != "" && nOffset != "" {
		return &response, []fdk.APIError{{
			Code:    http.StatusBadRequest,
			Message: fmt.Sprintf("previous and next both offset cannot be provided."),
		}}
	}

	navDir := nextPage
	if nOffset != "" {
		navDir = prevPage
		qOffset = nOffset
	}

	offset, page := getOffsetMeta(qOffset)

	var filters []models.Filter
	if filter != "" {
		filters = append(filters, models.Filter{
			Field: "job_id",
			Op:    models.EQ,
			Value: filter,
		})
	}

	filters = append(filters, models.Filter{
		Field: "modified_at",
		Value: "0",
		Op:    models.GTE,
	})

	fqlFilter, err := models.NewFQLQuery(filters)
	if err != nil {
		return &response, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: fmt.Errorf("error constructing FQL query: %s", err.Error()).Error(),
		}}
	}
	fqlSort, err := models.NewFQLSort("modified_at", models.Desc)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: fmt.Errorf("error constructing FQL sort: %s", err.Error()).Error(),
		}}
	}
	searchReq := models.SearchObjectsRequest{
		Collection: h.conf.AuditLogsCollection,
		Limit:      limit,
		Offset:     offset,
		Sort:       fqlSort,
		Filter:     fqlFilter,
	}

	searchResponse, auditListErrors := search(ctx, searchReq, fc)
	if len(auditListErrors) != 0 {
		return nil, auditListErrors
	}

	// no jobs or end of jobs case when the offset == elem
	auditsList := searchResponse.ObjectKeys
	totalRemain := len(auditsList)
	response.Meta = &models.Paging{
		Limit: limit,
		Total: searchResponse.Total,
		Count: totalRemain,
	}
	if totalRemain == 0 {
		return &response, errs
	}

	errChan := make(chan error, limit)
	auditDetail := make([]*models.Audit, limit)
	var wg sync.WaitGroup

	for idx := 0; idx < totalRemain; idx++ {
		id := auditsList[idx]
		wg.Add(1)
		go func(id string, count int) {
			defer wg.Done()

			audit, errs := auditInfo(ctx, id, h.conf, fc)
			if len(errs) != 0 {
				var jobGetErr error
				jobGetErr = fmt.Errorf("failed to get job: %s id: err: %v", id, errs)
				errChan <- jobGetErr
				return
			}
			auditDetail[count] = audit
		}(id, idx)
	}

	wg.Wait()
	close(errChan)

	for err := range errChan {
		errs = append(errs, models.NewAPIError(http.StatusInternalServerError, err.Error()))
	}

	for _, audit := range auditDetail {
		if audit == nil {
			break
		}
		response.Resources = append(response.Resources, *audit)
	}

	response.Meta.Prev, response.Meta.Next = pagination(navDir, page, offset, limit, searchResponse.Offset, searchResponse.Total)

	return &response, errs
}
