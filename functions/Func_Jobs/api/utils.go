package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon/client"
	"github.com/crowdstrike/gofalcon/falcon/client/custom_storage"
	model "github.com/crowdstrike/gofalcon/falcon/models"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

const (
	collectionAudit = "Jobs_Audit_logger"
	collectionJobs  = "Jobs_Info"
)

func jobInfo(ctx context.Context, id string, fc *client.CrowdStrikeAPISpecification) (models.Job, []fdk.APIError) {
	return getObject[models.Job](ctx, id, collectionJobs, fc)
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
		sor.Total = int(from(pagination.Total))
		sor.Offset = int(from(pagination.Offset))
	}
	res := payload.Resources
	if len(res) == 0 {
		return sor, nil
	}
	sor.ObjectKeys = make([]string, len(res))
	for i, r := range res {
		sor.ObjectKeys[i] = from(r.ObjectKey)
	}
	return sor, nil
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

func getObject[T any](ctx context.Context, id, collection string, fc *client.CrowdStrikeAPISpecification) (T, []fdk.APIError) {
	customJobRequest := custom_storage.NewGetObjectParamsWithContext(ctx)
	customJobRequest.SetObjectKey(id)
	customJobRequest.SetCollectionName(collection)

	buf := new(bytes.Buffer)
	_, err := fc.CustomStorage.GetObject(customJobRequest, buf)
	if err != nil {
		return *new(T), []fdk.APIError{{Code: http.StatusInternalServerError, Message: err.Error()}}
	}

	rawResponse, err := io.ReadAll(buf)
	if err != nil {
		return *new(T), []fdk.APIError{{Code: http.StatusInternalServerError, Message: err.Error()}}
	}

	var result T
	err = json.Unmarshal(rawResponse, &result)
	if err != nil {
		return *new(T), []fdk.APIError{{Code: http.StatusInternalServerError, Message: err.Error()}}
	}

	return result, nil
}

func from[T any](v *T) T {
	if v == nil {
		return *new(T)
	}
	return *v
}
