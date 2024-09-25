package api

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func auditHandlerFn(ctx context.Context, r fdk.Request) fdk.Response {
	audits, errs := auditDetails(ctx, &r, getFalconClient(ctx))
	if len(errs) != 0 {
		return fdk.ErrResp(errs...)
	}
	return fdk.Response{Code: http.StatusOK, Body: fdk.JSON(audits)}
}

func auditDetails(ctx context.Context, request *fdk.Request, fc *client.CrowdStrikeAPISpecification) (*models.AuditResponse, []fdk.APIError) {
	response := models.AuditResponse{
		Resources: make([]models.Audit, 0),
		Meta:      &models.Paging{Limit: 10},
	}

	limitParam := request.Params.Query.Get(queryLimit)
	if limitParam != "" {
		limit, err := strconv.Atoi(limitParam)
		if err != nil {
			return nil, []fdk.APIError{{
				Code:    http.StatusBadRequest,
				Message: fmt.Sprintf("limit is not an integer: %v", err),
			}}
		}
		response.Meta.Limit = limit
	}

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

	nOffset := request.Params.Query.Get(queryPrevOffset)
	qOffset := request.Params.Query.Get(queryNextOffset)
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

	limit := response.Meta.Limit

	searchReq := models.SearchObjectsRequest{
		Collection: collectionAudit,
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
		return &response, nil
	}

	errChan := make(chan error, limit)
	auditDetail := make([]*models.Audit, limit)
	var wg sync.WaitGroup

	for idx := 0; idx < totalRemain; idx++ {
		id := auditsList[idx]
		wg.Add(1)
		go func(id string, count int) {
			defer wg.Done()

			audit, errs := getObject[models.Audit](ctx, id, collectionAudit, fc)
			if len(errs) != 0 {
				var jobGetErr error
				jobGetErr = fmt.Errorf("failed to get job: %s id: err: %v", id, errs)
				errChan <- jobGetErr
				return
			}
			auditDetail[count] = &audit
		}(id, idx)
	}

	wg.Wait()
	close(errChan)

	var errs []fdk.APIError
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
