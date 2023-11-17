package api

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

const (
	queryLimit       = "limit"
	queryNextOffset  = "next"
	queryPrevOffset  = "prev"
	queryParamFilter = "filter"

	nextPage = 1
	prevPage = -1
)

// JobsHandler executes a given request to the FaaS function.
type JobsHandler struct {
	conf *models.Config
}

// NewJobsHandler returns a new instance of JobsHandler.
func NewJobsHandler(conf *models.Config) *JobsHandler {
	return &JobsHandler{
		conf: conf,
	}
}

func (h *JobsHandler) Handle(ctx context.Context, request fdk.Request) fdk.Response {
	response := fdk.Response{}
	var err error

	fc, err := models.FalconClient(ctx, h.conf, request)
	if err != nil {
		response.Code = http.StatusInternalServerError
		response.Errors = append(response.Errors, fdk.APIError{Code: http.StatusBadRequest, Message: "fail to initialize client"})
		return response
	}

	jobs, errs := h.jobDetails(ctx, &request, fc)
	if len(errs) != 0 {
		response.Code = http.StatusInternalServerError
		response.Errors = errs
		return response
	}

	body, err := json.Marshal(jobs)
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
func (h *JobsHandler) jobDetails(ctx context.Context, request *fdk.Request, fc *client.CrowdStrikeAPISpecification) (*models.JobsResponse, []fdk.APIError) {
	// Default limit set to 10
	limit := 10
	var response models.JobsResponse

	var errs []fdk.APIError
	var err error

	response.Resources = make([]models.Job, 0)
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
	filters = append(filters, models.Filter{
		Field: "created_at",
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
	fqlSort, err := models.NewFQLSort("updated_at", models.Desc)
	if err != nil {
		return nil, []fdk.APIError{{
			Code:    http.StatusInternalServerError,
			Message: fmt.Errorf("error constructing FQL sort: %s", err.Error()).Error(),
		}}
	}
	searchReq := models.SearchObjectsRequest{
		Collection: h.conf.JobsCollection,
		Limit:      limit,
		Offset:     offset,
		Sort:       fqlSort,
		Filter:     fqlFilter,
	}

	searchResponse, jobListErrs := search(ctx, searchReq, fc)
	if len(jobListErrs) != 0 {
		return nil, jobListErrs
	}

	jobsList := searchResponse.ObjectKeys
	totalRemain := len(jobsList)
	response.Resources = make([]models.Job, 0)
	response.Meta = &models.Paging{
		Limit: limit,
		Total: searchResponse.Total,
		Count: totalRemain,
	}

	// no jobs or end of jobs case when the offset == elem
	if totalRemain == 0 {
		return &response, errs
	}

	errChan := make(chan error, limit)
	jobsDetail := make([]*models.Job, limit)
	var wg sync.WaitGroup

	for idx := 0; idx < totalRemain; idx++ {
		id := jobsList[idx]

		wg.Add(1)
		go func(id string, count int) {
			defer wg.Done()

			job, errs := jobInfo(ctx, id, h.conf, fc)
			if len(errs) != 0 {
				var jobGetErr error
				jobGetErr = fmt.Errorf("failed to get job: %s id: err: %v", id, errs)
				errChan <- jobGetErr
				return
			}
			jobsDetail[count] = job
		}(id, idx)
	}

	wg.Wait()
	close(errChan)

	//Test comments
	for err := range errChan {
		errs = append(errs, models.NewAPIError(http.StatusInternalServerError, err.Error()))
	}

	for _, job := range jobsDetail {
		if job == nil {
			break
		}
		response.Resources = append(response.Resources, *job)
	}

	response.Meta.Prev, response.Meta.Next = pagination(navDir, page, offset, limit, searchResponse.Offset, searchResponse.Total)

	return &response, errs
}

func pagination(navDir, currentPage, currentOffset, limit, offset, total int) (string, string) {
	prevOffset, nextOffset := "", ""

	if currentPage == 0 { // first page
		if total == 0 || offset == 0 { // no results or no more results
			return prevOffset, nextOffset
		}

		nextOffset = fmt.Sprintf("%d:1", offset)
		return prevOffset, nextOffset
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if offset == 0 { // last page of multiple pages
		if idx := currentOffset - limit; idx >= 0 {
			prevOffset = fmt.Sprintf("%d:%d", idx, totalPages-1)
		}
		return prevOffset, nextOffset
	}

	// multiple pages and somewhere in the middle
	if navDir == nextPage {
		nextOffset = fmt.Sprintf("%d:%d", offset, currentPage+1)
	} else {
		nextOffset = fmt.Sprintf("%d:%d", offset, currentPage)
	}
	prevOffset = "0:1"
	if idx := currentOffset - limit; idx > 0 {
		prevOffset = fmt.Sprintf("%d:%d", idx, currentPage)
	}

	return prevOffset, nextOffset
}

func getOffsetMeta(marker string) (int, int) {
	offsetMeta := strings.Split(marker, ":")
	if len(offsetMeta) != 2 {
		return 0, 0
	}

	page, _ := strconv.Atoi(offsetMeta[1])
	offset, _ := strconv.Atoi(offsetMeta[0])
	return offset, page
}
