package processor

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/pkg"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/storagec"
	"github.com/sirupsen/logrus"
)

// ExecutionsProcessor returns the job execution history.
type ExecutionsProcessor struct {
	logger      logrus.FieldLogger
	strgc       storagec.StorageC
	nowProvider func() time.Time
}

// NewExecutionsProcessor returns a new ExecutionsProcessor instance.
func NewExecutionsProcessor(strgc storagec.StorageC, logger logrus.FieldLogger, opts ...func(p *ExecutionsProcessor)) *ExecutionsProcessor {
	p := &ExecutionsProcessor{
		logger:      logger,
		strgc:       strgc,
		nowProvider: nowT,
	}
	for _, o := range opts {
		o(p)
	}
	return p
}

// Process returns any job execution histories that match the provided request parameters.
func (p *ExecutionsProcessor) Process(ctx context.Context, req fdk.Request) Response {
	queryParams := req.Queries
	if len(queryParams) == 0 {
		queryParams = make(url.Values)
	}
	filterReq, err := buildFilterJobExecsRequest(queryParams)
	if err != nil {
		msg := fmt.Sprintf("bad arguments in param.query: %s", err)
		return Response{
			Body: jobExecRespJSON(nil, nil, []fdk.APIError{{Code: http.StatusBadRequest, Message: msg}}, p.logger),
			Code: http.StatusBadRequest,
			Errs: []fdk.APIError{{Code: http.StatusBadRequest, Message: msg}},
		}
	}

	jobExecs, offset, total, err := p.searchExecutions(ctx, filterReq, p.now())
	if err != nil {
		if errors.Is(err, storagec.NotFound) {
			return Response{
				Body: jobExecRespJSON(nil, nil, []fdk.APIError{{Code: http.StatusNotFound, Message: "not found"}}, p.logger),
				Code: http.StatusNotFound,
				Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: "not found"}},
			}
		}
		msg := fmt.Sprintf("failed to fetch all objects: %s", err)
		p.logger.Errorln(msg)
		return Response{
			Body: jobExecRespJSON(nil, nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}, p.logger),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	jobExecs, err = p.computeDurations(jobExecs)
	if err != nil {
		p.logger.Errorf("failed to compute duration for job executions: %s", err)
	}

	nextPrevOffset, nextNextOffset := p.pagination(filterReq.Offset.Direction, filterReq.Offset.Page, filterReq.Offset.Offset, filterReq.Limit, offset, total)
	resp := jobExecRespJSON(
		&paging{
			Count: len(jobExecs),
			Limit: filterReq.Limit,
			Next:  nextNextOffset,
			Prev:  nextPrevOffset,
			Total: total,
		},
		jobExecs,
		nil,
		p.logger,
	)
	if resp == nil {
		msg := "failed to serialize job execution response"
		p.logger.Errorln(msg)
		return Response{
			Body: jobExecRespJSON(nil, nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}, p.logger),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}
	return Response{
		Body: resp,
		Code: http.StatusOK,
	}
}

func (p *ExecutionsProcessor) searchExecutions(ctx context.Context, filterReq filterJobExecsRequest, now string) ([]pkg.JobExecution, int, int, error) {
	filters := make([]pkg.Filter, 0, 2)
	filters = append(filters, pkg.Filter{
		Field: "run_date",
		Op:    pkg.GTE,
		Value: filterReq.EarliestRunDate,
	})
	filters = append(filters, pkg.Filter{
		Field: "run_date",
		Op:    pkg.LTE,
		Value: now,
	})
	if filterReq.JobID != "" {
		filters = append(filters, pkg.Filter{
			Field: "id",
			Op:    pkg.EQ,
			Value: filterReq.JobID,
		})
	}
	if filterReq.JobName != "" {
		filters = append(filters, pkg.Filter{
			Field: "name",
			Op:    pkg.MATCH,
			Value: filterReq.JobName,
		})
	}
	fqlFilter, err := pkg.NewFQLQuery(filters)
	if err != nil {
		err = fmt.Errorf("error constructing FQL query: %s", err.Error())
		return nil, 0, 0, err
	}
	fqlSort, err := pkg.NewFQLSort("run_date", pkg.Desc)
	if err != nil {
		err = fmt.Errorf("error constructing FQL sort: %s", err.Error())
		return nil, 0, 0, err
	}
	searchReq := storagec.SearchObjectsRequest{
		Collection: jobExecutionCollection,
		Filter:     fqlFilter,
		Limit:      filterReq.Limit,
		Offset:     filterReq.Offset.Offset,
		Sort:       fqlSort,
	}
	searchResp, err := p.strgc.SearchAndFetch(ctx, searchReq)
	if err != nil {
		err = fmt.Errorf("error retrieving records: %s", err.Error())
		return nil, 0, 0, err
	}
	jobExecs := make([]pkg.JobExecution, len(searchResp.Objects))
	for i, b := range searchResp.Objects {
		je, err := pkg.DecodeJobExecution(b.Data)
		if err != nil {
			return nil, 0, 0, fmt.Errorf("error decoding job execution record: %s", err.Error())
		}
		if je.JobID == "" {
			je.JobID = je.ID
		} else if je.ID == "" {
			je.ID = je.JobID
		}
		if je.TargetedHosts == nil {
			je.TargetedHosts = make([]pkg.TargetedHost, 0)
		}
		je.Hosts = make([]string, len(je.TargetedHosts))
		for ti, h := range je.TargetedHosts {
			je.Hosts[ti] = h.HostName
		}
		jobExecs[i] = je
	}
	return jobExecs, searchResp.Offset, searchResp.Total, nil
}

func (p *ExecutionsProcessor) now() string {
	return p.nowProvider().Format(pkg.ISOTimeFormat)
}

func (p *ExecutionsProcessor) computeDurations(execs []pkg.JobExecution) ([]pkg.JobExecution, error) {
	for i, e := range execs {
		endDate := e.EndDate
		if endDate == "" {
			endDate = p.now()
		}
		d, err := computeJobDuration(e.RunDate, endDate, e.RunStatus)
		if err != nil {
			return nil, nil
		}
		if e.RunStatus == pkg.StatusInProgress {
			e.Duration = d
		}
		execs[i] = e
	}
	return execs, nil
}

func buildFilterJobExecsRequest(q url.Values) (filterJobExecsRequest, error) {
	jobID := ""
	jobName := ""
	limit := 10
	oneWeekAgo := time.Now().UTC().Add(-7 * (24 * time.Hour))
	runDate := oneWeekAgo.Format(pkg.ISOTimeFormat)

	filterParam := q.Get("filter")
	if filterParam != "" {
		tokens := strings.Split(filterParam, "&")
		for _, t := range tokens {
			t = strings.TrimSpace(t)
			colIdx := strings.Index(t, ":")
			if colIdx < 1 || len(t)-1 <= colIdx {
				continue
			}
			k, v := strings.TrimSpace(t[:colIdx]), strings.TrimSpace(t[colIdx+1:])
			if v == "" {
				continue
			}
			switch k {
			case "job_id":
				jobID = v
			case "job_name":
				jobName = v
			}
		}
	}
	if s := strings.TrimSpace(q.Get("limit")); s != "" {
		l, err := strconv.Atoi(s)
		if err != nil {
			return filterJobExecsRequest{}, fmt.Errorf("failed to convert limit to integer: %s", err)
		}
		if l > 0 {
			limit = l
		}
	}

	next, prev := q.Get("next"), q.Get("prev")
	var offset offsetMeta
	if prev != "" {
		offset = asOffsetMeta(prev)
		offset.Direction = prevPage
	} else {
		offset = asOffsetMeta(next)
		offset.Direction = nextPage
	}

	return filterJobExecsRequest{
		JobID:           jobID,
		JobName:         jobName,
		Limit:           limit,
		EarliestRunDate: runDate,
		Offset:          offset,
	}, nil
}

func (p *ExecutionsProcessor) pagination(navDir, currentPage, currentOffset, limit, offset, total int) (string, string) {
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

func asOffsetMeta(offset string) offsetMeta {
	om := strings.Split(offset, ":")
	if len(om) != 2 {
		return offsetMeta{Offset: 0, Page: 0}
	}

	offsetI, _ := strconv.Atoi(om[0])
	pageI, _ := strconv.Atoi(om[1])
	if offsetI == 0 {
		pageI = 0
	}
	return offsetMeta{Offset: offsetI, Page: pageI}
}
