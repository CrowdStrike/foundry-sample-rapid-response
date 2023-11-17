package searchc

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/crowdstrike/gofalcon/falcon/client/saved_searches"
	"github.com/crowdstrike/gofalcon/falcon/models"
	"github.com/eapache/go-resiliency/retrier"
	"github.com/sirupsen/logrus"
)

// SearchC represents a search client.
type SearchC interface {
	// Search issues a search against Logscale, returning any matching events.
	Search(ctx context.Context, req SearchRequest) (SearchResponse, error)
}

// Client is the client.
type Client struct {
	c      saved_searches.ClientService
	logger logrus.FieldLogger
}

var _ SearchC = (*Client)(nil)

// NewClient returns a new search client.
func NewClient(c saved_searches.ClientService, logger logrus.FieldLogger) *Client {
	return &Client{
		c:      c,
		logger: logger,
	}
}

func (f *Client) Search(ctx context.Context, req SearchRequest) (SearchResponse, error) {
	jobID, err := f.startSearchJob(ctx, req)
	if err != nil {
		return SearchResponse{}, fmt.Errorf("failed to start search: %s", err)
	}
	if jobID == "" {
		return SearchResponse{}, nil
	}
	if req.InitialFetchPause >= 0 {
		f.logger.Print("pausing to allow job to run")
		if req.InitialFetchPause > 0 {
			time.Sleep(req.InitialFetchPause)
		} else {
			time.Sleep(5 * time.Second)
		}
		f.logger.Print("waking up to fetch results")
	}

	resp, err := f.fetchSearchResults(ctx, req, jobID)
	if err != nil {
		return SearchResponse{}, fmt.Errorf("failed to fetch search results: %s", err)
	}
	return resp, nil
}

func (f *Client) startSearchJob(ctx context.Context, req SearchRequest) (string, error) {
	boolFalse := false
	mode := modeAsync
	params := saved_searches.NewExecuteParams()
	params.Body = &models.ApidomainSavedSearchExecuteRequestV1{
		Name:       "Query By WorkflowRootExecutionID",
		Parameters: req.SearchParams,
	}
	params.Context = ctx
	params.IncludeTestData = &boolFalse
	params.Mode = &mode

	f.logger.Println("starting search")
	res, err := f.c.Execute(params)
	if err != nil {
		return "", fmt.Errorf("attempting to create search failed: %s", err)
	}
	payload := res.Payload
	if payload == nil {
		return "", errors.New("empty payload")
	}
	errs := res.Payload.Errors
	if len(errs) != 0 {
		return "", joinMsaAPIErrors(errs)
	}
	resources := res.Payload.Resources
	if len(resources) == 0 {
		return "", nil
	}

	js := resources[0].JobStatus
	if js == nil {
		return "", fmt.Errorf("missing job status in response")
	}
	if js.JobID == nil {
		return "", fmt.Errorf("missing job ID in response")
	}
	return *js.JobID, nil
}

func (f *Client) fetchSearchResults(ctx context.Context, req SearchRequest, jobID string) (SearchResponse, error) {
	offset := 0
	maxPollAttempts := 10
	if req.MaxPollAttempts > 0 {
		maxPollAttempts = req.MaxPollAttempts
	}

	sr := SearchResponse{
		JobID: jobID,
	}
	events := make(map[string]map[string]any)
	var s SearchResponse
	var err error
	// No new events means no more data.
	// This is a hack to work around an offset bug in the foundrylogging api.
	// The limit is ignored once the offset >= the total number events matched
	// by the saved search.
	pre := -1
	for pre != offset {
		s, err = f.fetchSearchResultsPage(ctx, jobID, maxPollAttempts, offset)
		if s.JobStatus != "" {
			sr.JobStatus = s.JobStatus
		}
		if s.JobURL != "" {
			sr.JobURL = s.JobURL
		}

		pre = len(events)
		for _, e := range s.Events {
			events[e["@id"].(string)] = e
		}
		offset = len(events)
	}

	sr.Events = make([]map[string]any, len(events))
	i := 0
	for _, e := range events {
		sr.Events[i] = e
		i++
	}

	return sr, err
}

func (f *Client) fetchSearchResultsPage(ctx context.Context, jobID string, maxPollAttempts int, offset int) (SearchResponse, error) {
	var ssfr savedSearchFetchResource
	err := retrier.New(retrier.ConstantBackoff(maxPollAttempts-1, 5*time.Second), nil).Run(func() error {
		fetchRes, err0 := f.fetchSearchResultsCall(ctx, jobID, offset)
		if err0 != nil {
			return err0
		}
		ssfr = fetchRes
		return nil
	})

	sr := SearchResponse{
		JobID:     jobID,
		JobStatus: ssfr.Status.Status,
		JobURL:    ssfr.Status.URL,
	}
	if len(ssfr.Events) > 0 {
		res := make([]map[string]any, len(ssfr.Events))
		for i, e := range ssfr.Events {
			res[i] = e.(map[string]any)
		}
		sr.Events = res
	}

	return sr, err
}

func (f *Client) fetchSearchResultsCall(ctx context.Context, jobID string, offset int) (savedSearchFetchResource, error) {
	limit := "1000"
	os := strconv.Itoa(offset)
	params := saved_searches.NewResultParams()
	params.Context = ctx
	params.JobID = jobID
	params.Limit = &limit
	params.Offset = &os

	f.logger.WithField("job_id", jobID).
		WithField("offset", os).
		WithField("limit", limit).
		Info("fetching search results")
	resp, err := f.c.Result(params)
	if err != nil {
		return savedSearchFetchResource{}, fmt.Errorf("failed to issue HTTP request: %s", err)
	}

	payload := resp.Payload
	if payload == nil {
		return savedSearchFetchResource{}, nil
	}
	if len(payload.Errors) > 0 {
		return savedSearchFetchResource{}, joinMsaAPIErrors(payload.Errors)
	}

	resources := payload.Resources
	if len(resources) == 0 {
		return savedSearchFetchResource{}, nil
	}
	resource := resources[0]
	js := resource.JobStatus
	if js == nil {
		return savedSearchFetchResource{}, errors.New("no job status returned")
	}
	if js.Status != "complete" {
		return savedSearchFetchResource{}, fmt.Errorf("job %s not complete: %s", jobID, js.Status)
	}
	events := make([]any, len(resource.Events))
	for i, e := range resource.Events {
		events[i] = e
	}
	return savedSearchFetchResource{
		Events:     events,
		EventCount: len(events),
		Status: jobStatus{
			ID:     asString(js.JobID),
			Status: js.Status,
			URL:    js.JobURL,
		},
	}, nil
}

func joinMsaAPIErrors(errs []*models.MsaAPIError) error {
	if len(errs) == 0 {
		return nil
	}
	var sb strings.Builder
	for i, err := range errs {
		if i == 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(fmt.Sprintf("[%d] %s", err.Code, asString(err.Message)))
	}
	return errors.New(sb.String())
}

func asString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
