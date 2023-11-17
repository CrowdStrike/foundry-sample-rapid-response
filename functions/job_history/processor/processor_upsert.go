package processor

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/robfig/cron/v3"
	"net/http"
	"sort"
	"strings"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/pkg"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/searchc"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/storagec"
	"github.com/sirupsen/logrus"
	"github.com/spaolacci/murmur3"
)

// UpsertProcessor upserts a job execution.
type UpsertProcessor struct {
	falconHost  string
	logger      logrus.FieldLogger
	srchc       searchc.SearchC
	strgc       storagec.StorageC
	nowProvider func() time.Time
}

// NewUpsertProcessor creates a new initialized UpsertProcessor instance.
func NewUpsertProcessor(host string, srchc searchc.SearchC, strgc storagec.StorageC, logger logrus.FieldLogger, opts ...func(p *UpsertProcessor)) *UpsertProcessor {
	p := &UpsertProcessor{
		falconHost:  host,
		logger:      logger,
		srchc:       srchc,
		strgc:       strgc,
		nowProvider: nowT,
	}

	for _, o := range opts {
		o(p)
	}
	return p
}

// Process handles a request.
func (p *UpsertProcessor) Process(ctx context.Context, req fdk.Request) Response {
	p.logger.Infof("received upsert request: %s", string(req.Body))
	wfMeta, err := wfMetaFromRequest(req)
	if err != nil {
		msg := fmt.Sprintf("failed to extract job information from request: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusBadRequest, Message: msg}}),
			Code: http.StatusBadRequest,
			Errs: []fdk.APIError{{Code: http.StatusBadRequest, Message: msg}},
		}
	}

	if wfMeta.Status == "" {
		p.logger.Info("received workflow metadata event with blank status - ignoring")
		return Response{
			Body: p.genOutRespJSON([]generateOutputResponseResource{{Name: "", Status: "ok"}}, nil),
			Code: http.StatusOK,
			Errs: nil,
		}
	}

	jobName, err := wfMeta.jobName()
	p.logger.Infof("received upsert request for job ID: %s", jobName)
	if err != nil {
		msg := fmt.Sprintf("bad job name provided: %s", err)
		p.logger.WithField("workflow_meta", wfMeta).Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusBadRequest, Message: msg}}),
			Code: http.StatusBadRequest,
			Errs: []fdk.APIError{{Code: http.StatusBadRequest, Message: msg}},
		}
	}
	jobID, err := generateJobID(jobName)
	if err != nil {
		msg := fmt.Sprintf("job ID could not be determined: %s", err)
		p.logger.WithField("job_name", jobName).Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}
	jobMap, err := p.fetchObject(ctx, jobCollection, jobID)
	if err != nil {
		msg := fmt.Sprintf("could not fetch job record: %s", err)
		p.logger.WithField("job_name", jobName).
			WithField("job_id", jobID).Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}
	jobInstance, err := distillJob(jobMap)
	if err != nil {
		msg := fmt.Sprintf("could not distill job record from dictionary: %s", err)
		p.logger.WithField("job_name", jobName).
			WithField("job_id", jobID).Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	jobExecutionKey, execRecord, newExec, err := p.jobExecutionRecord(ctx, jobID, jobName, wfMeta)
	if err != nil {
		msg := fmt.Sprintf("failed to fetch job execution record: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}
	endDate := execRecord.EndDate
	if endDate == "" {
		endDate = p.now()
		if wfMeta.Status == pkg.StatusCompleted || wfMeta.Status == pkg.StatusFailed {
			execRecord.EndDate = endDate
		}
	}
	d, err := computeJobDuration(execRecord.RunDate, endDate, wfMeta.Status)
	if err != nil {
		msg := fmt.Sprintf("failed to compute job duration execution: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}
	if d != "" {
		execRecord.Duration = d
	}

	if wfMeta.Status != "" {
		execRecord.RunStatus = wfMeta.Status
	}

	lsResp, err := p.execLSResults(ctx, wfMeta.ExecutionID)
	if err != nil {
		msg := fmt.Sprintf("failed to execute logscale search: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	hosts := extractHostsFromLogscale(lsResp, p.logger)
	execRecord.TargetedHosts = hosts
	execRecord.NumHosts = len(hosts)
	if !newExec {
		execRecord.LogscaleOutput = lsResp.JobURL
	}

	jobInstance, err = p.updateJobRunStats(jobInstance, execRecord.RunStatus)
	if err != nil {
		msg := fmt.Sprintf("failed to update job record: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	jobMap, err = updateJobMap(jobInstance, jobMap)
	if err != nil {
		msg := fmt.Sprintf("failed to map job instance to job map: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	err = p.putExecutionRecordObject(ctx, jobExecutionCollection, jobExecutionKey, execRecord)
	if err != nil {
		msg := fmt.Sprintf("failed to save execution record: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	err = p.putJobMap(ctx, jobCollection, jobID, jobMap)
	if err != nil {
		msg := fmt.Sprintf("failed to save job record: %s", err)
		p.logger.Error(msg)
		return Response{
			Body: p.genOutRespJSON(nil, []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}}),
			Code: http.StatusInternalServerError,
			Errs: []fdk.APIError{{Code: http.StatusInternalServerError, Message: msg}},
		}
	}

	return Response{
		Body: jobExecRespJSON(nil, []pkg.JobExecution{execRecord}, nil, p.logger),
		Code: http.StatusOK,
	}
}

func (p *UpsertProcessor) jobExecutionRecord(ctx context.Context, jobID, jobName string, wfMeta workflowMeta) (string, pkg.JobExecution, bool, error) {
	tsNano, err := time.Parse(pkg.ISOTimeFormat, wfMeta.ExecutionTimestamp)
	if err != nil {
		return "", pkg.JobExecution{}, false, fmt.Errorf("failed to parse execution timestamp: %s", err)
	}
	var execRecordMap map[string]any
	jobExecutionKey, err := p.locateJobExecution(ctx, wfMeta.ExecutionID)
	if jobExecutionKey == "" {
		jobExecutionKey = fmt.Sprintf("%d_%s", tsNano.UnixNano(), wfMeta.ExecutionID)
		err = storagec.NotFound
	} else {
		execRecordMap, err = p.fetchObject(ctx, jobExecutionCollection, jobExecutionKey)
	}
	newExec := false
	if err != nil {
		if !errors.Is(err, storagec.NotFound) {
			return "", pkg.JobExecution{}, false, err
		}
		newExec = true
		p.logger.WithField("object_key", jobExecutionKey).
			WithField("execution_id", wfMeta.ExecutionID).
			Error("job execution not found, creating")
		execRecordMap = map[string]any{
			"execution_id": wfMeta.ExecutionID,
			"id":           jobID,
			"job_id":       jobID,
			"name":         jobName,
			"run_date":     wfMeta.ExecutionTimestamp,
		}
	}

	execRecord, err := mapToJobExecution(execRecordMap)
	if err != nil {
		return jobExecutionKey, pkg.JobExecution{}, false, fmt.Errorf("failed to deserialize job execution record: %s", err)
	}

	return jobExecutionKey, execRecord, newExec, nil
}

func (p *UpsertProcessor) locateJobExecution(ctx context.Context, execID string) (string, error) {
	sr, err := p.strgc.Search(ctx, storagec.SearchObjectsRequest{
		Collection: jobExecutionCollection,
		Filter:     fmt.Sprintf("execution_id:'%s'", execID),
	})
	if len(sr.ObjectKeys) == 0 {
		return "", err
	}
	// there can only be one
	return sr.ObjectKeys[0], err
}

func extractHostsFromLogscale(sr searchc.SearchResponse, l logrus.FieldLogger) []pkg.TargetedHost {
	events := sr.Events
	if len(events) == 0 {
		return make([]pkg.TargetedHost, 0)
	}

	devSet := make(map[string]logscaleRecord)
	for _, e := range events {
		lr, lrOk := extractLogscaleInstall(e)
		if !lrOk {
			lr, lrOk = extractLogscaleRemove(e, l)
		}
		if lrOk {
			devSet[lr.HostName] = lr
		}
	}

	devs, i := make([]pkg.TargetedHost, len(devSet)), 0
	for _, d := range devSet {
		status := pkg.StatusFailed
		if d.Success == "true" {
			status = pkg.StatusCompleted
		}
		devs[i] = pkg.TargetedHost{
			DeviceID: "",
			HostName: d.HostName,
			Status:   status,
		}
		i++
	}

	sort.Slice(devs, func(i, j int) bool {
		return devs[i].HostName <= devs[j].HostName
	})

	return devs
}

func extractLogscaleInstall(e map[string]any) (logscaleRecord, bool) {
	hostName := ""
	ok := false
	s := ""
	stderr := ""
	stdout := ""

	for k, v := range e {
		k = strings.ToLower(k)
		switch {
		case strings.HasSuffix(k, "device.getdetails.hostname"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				hostName = strings.TrimSpace(s)
			}
		case strings.HasSuffix(k, "rtr.putandrun.stderr"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				stderr = strings.TrimSpace(s)
			}
		case strings.HasSuffix(k, "rtr.putandrun.stdout"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				stdout = strings.TrimSpace(s)
			}
		}
	}

	if hostName == "" {
		return logscaleRecord{}, false
	}
	if stderr != "" {
		return logscaleRecord{HostName: hostName, Success: "false"}, true
	}
	return logscaleRecord{HostName: hostName, Success: "true"}, stdout != ""
}

func extractLogscaleRemove(e map[string]any, l logrus.FieldLogger) (logscaleRecord, bool) {
	hostName := ""
	ok := false
	s := ""
	checkSuccessful := ""
	removeSuccessful := ""

	for k, v := range e {
		k = strings.ToLower(k)
		switch {
		case strings.HasSuffix(k, "device.getdetails.hostname"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				hostName = strings.TrimSpace(s)
			}
		case strings.HasSuffix(k, "rtr.app_check_file_exist_rtr_2.file_exists"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				checkSuccessful = strings.TrimSpace(s)
			}
		case strings.HasSuffix(k, "rtr.app_remove_file_rtr_2.file_exists"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				removeSuccessful = strings.TrimSpace(s)
			}
		case strings.HasSuffix(k, "rtr.app_remove_file_rtr_2.response"):
			if s, ok = v.(string); ok && strings.TrimSpace(s) != "" {
				rs, err := isRemoveSuccessful(s)
				if err != nil {
					l.WithField("key", k).Error(err)
					return logscaleRecord{}, false
				}
				if rs != "" {
					removeSuccessful = rs
				}
			}
		}
	}

	if hostName == "" {
		return logscaleRecord{}, false
	}
	if removeSuccessful != "" {
		checkSuccessful = removeSuccessful
	}
	return logscaleRecord{HostName: hostName, Success: checkSuccessful},
		checkSuccessful == "true" || checkSuccessful == "false"
}

func isRemoveSuccessful(s string) (string, error) {
	var m map[string]any
	if err := json.Unmarshal([]byte(s), &m); err != nil {
		return "", err
	}

	existsA, ok := m["file_exists"]
	if !ok {
		return "", nil
	}

	if existsS, ok := existsA.(string); ok {
		if existsS == "true" || existsS == "false" {
			return existsS, nil
		}
		return "", fmt.Errorf("unknown truth value: %q", existsS)
	}
	if existsB, ok := existsA.(bool); ok {
		if existsB {
			return "true", nil
		}
		return "false", nil
	}

	return "", fmt.Errorf("unknown truth value: %v", existsA)
}

func mapToJobExecution(m map[string]any) (pkg.JobExecution, error) {
	b, err := json.Marshal(m)
	if err != nil {
		return pkg.JobExecution{}, err
	}
	var j pkg.JobExecution
	err = json.Unmarshal(b, &j)
	return j, err
}

func computeJobDuration(start, end, status string) (string, error) {
	if start == "" {
		return "", nil
	}
	if !(status == pkg.StatusFailed || status == pkg.StatusInProgress || status == pkg.StatusCompleted) {
		return "", nil
	}
	if status == pkg.StatusInProgress && end == "" {
		end = time.Now().UTC().Format(pkg.ISOTimeFormat)
	}

	startT, err := time.Parse(pkg.ISOTimeFormat, start)
	if err != nil {
		return "", err
	}
	endT, err := time.Parse(pkg.ISOTimeFormat, end)
	if err != nil {
		return "", err
	}

	days, hours, minutes, seconds := int64(0), int64(0), int64(0), int64(0)
	delta := endT.UnixNano() - startT.UnixNano()
	days = delta / int64(time.Hour*24)
	delta -= int64(time.Hour*24) * days
	if delta > 0 {
		hours = delta / int64(time.Hour)
		delta -= int64(time.Hour) * hours
	}
	if delta > 0 {
		minutes = delta / int64(time.Minute)
		delta -= int64(time.Minute) * minutes
	}
	if delta > 0 {
		seconds = delta / int64(time.Second)
	}

	if days > 0 {
		hours += 24 * days
	}
	return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds), nil
}

func wfMetaFromRequest(req fdk.Request) (workflowMeta, error) {
	var wfMeta workflowMeta

	if len(req.Body) == 0 {
		return wfMeta, errors.New("empty request body")
	}
	if err := json.Unmarshal(req.Body, &wfMeta); err != nil {
		return wfMeta, err
	}

	if wfMeta.ExecutionID == "" {
		return wfMeta, errors.New("missing execution ID")
	}
	if wfMeta.DefinitionName == "" {
		return wfMeta, errors.New("missing definition name")
	}
	if strings.Index(wfMeta.DefinitionName, "-") < 0 {
		return wfMeta, errors.New("definition name does not contain job name")
	}
	wfMeta.Status = pkg.NormalizeJobStatus(wfMeta.Status)

	return wfMeta, nil
}

func (p *UpsertProcessor) putExecutionRecordObject(ctx context.Context, collection, object string, execRecord pkg.JobExecution) error {
	execRecordB, err := json.Marshal(execRecord)
	if err != nil {
		return err
	}
	return p.putObject(ctx, collection, object, execRecordB)
}

func (p *UpsertProcessor) putJobMap(ctx context.Context, collection, object string, jobMap map[string]any) error {
	jobB, err := json.Marshal(jobMap)
	if err != nil {
		return err
	}
	return p.putObject(ctx, collection, object, jobB)
}

func (p *UpsertProcessor) putObject(ctx context.Context, collection, object string, data []byte) error {
	req := storagec.PutObjectRequest{
		Collection: collection,
		Data:       data,
		ObjectKey:  object,
	}
	_, err := p.strgc.PutObject(ctx, req)
	return err
}

func (p *UpsertProcessor) genOutRespJSON(g []generateOutputResponseResource, e []fdk.APIError) []byte {
	r := generateOutputResponse{Errs: e, Resources: g}
	rJSON, err := json.Marshal(r)
	if err != nil {
		p.logger.Errorf("failed to serialize response: %s", err)
		return nil
	}
	return rJSON
}

func (p *UpsertProcessor) execLSResults(ctx context.Context, execID string) (searchc.SearchResponse, error) {
	req := searchc.SearchRequest{
		SearchName: "Query By WorkflowRootExecutionID",
		SearchParams: map[string]string{
			"execution_id": execID,
		},
	}
	return p.srchc.Search(ctx, req)
}

func (p *UpsertProcessor) fetchObject(ctx context.Context, collection, objectKey string) (map[string]any, error) {
	req := storagec.FetchObjectRequest{
		Collection: collection,
		ObjectKey:  objectKey,
	}
	resp, err := p.strgc.FetchObject(ctx, req)
	if errors.Is(err, storagec.NotFound) {
		return nil, err
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch record: %s", err)
	}
	if len(resp.Data) == 0 {
		return nil, storagec.NotFound
	}

	data, err := pkg.DecodeBase64JSON(resp.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize record: %s", err)
	}

	var obj map[string]any
	if err = json.Unmarshal(data, &obj); err != nil {
		return nil, fmt.Errorf("failed to deserialize record: %s", err)
	}
	return obj, nil
}

func (p *UpsertProcessor) now() string {
	return p.nowProvider().Format(pkg.ISOTimeFormat)
}

func generateJobID(key string) (string, error) {
	b := murmur3.New128()
	_, err := b.Write([]byte(key))
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b.Sum(nil)), nil
}

func distillJob(jobMap map[string]any) (job, error) {
	var j job
	b, err := json.Marshal(jobMap)
	if err != nil {
		return j, err
	}
	if len(b) == 0 {
		return j, errors.New("empty job structure")
	}
	if err = json.Unmarshal(b, &j); err != nil {
		return j, fmt.Errorf("failed to parse job: %s", err)
	}
	return j, err
}

func updateJobMap(j job, jobMap map[string]any) (map[string]any, error) {
	jobMap["last_run"] = j.LastRun
	jobMap["next_run"] = j.NextRun
	jobMap["run_count"] = j.RunCount
	jobMap["total_recurrences"] = j.TotalRecurrences
	if j.Schedule == nil {
		jobMap["schedule"] = nil
		return jobMap, nil
	}

	schB, err := json.Marshal(j.Schedule)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize job schedule: %s", err)
	}
	if len(schB) == 0 {
		jobMap["schedule"] = nil
		return jobMap, nil
	}

	var sch map[string]any
	if err = json.Unmarshal(schB, &sch); err != nil {
		return nil, fmt.Errorf("failed to deserialize job schedule: %s", err)
	}
	jobMap["schedule"] = sch
	return jobMap, nil
}

func (p *UpsertProcessor) updateJobRunStats(j job, status string) (job, error) {
	if status != pkg.StatusInProgress {
		return j, nil
	}

	now := p.nowProvider()
	if j.RunCount > 0 {
		if j.Schedule == nil {
			return j, nil
		}
		j.LastRun = j.NextRun
		j.RunCount++
		if j.RunCount == j.TotalRecurrences {
			return j, nil
		}

		if j.Schedule.TimeCycle == "" {
			// this really shouldn't happen but...
			return j, nil
		}

		s, err := cron.ParseStandard(j.Schedule.TimeCycle)
		if err != nil {
			return j, fmt.Errorf("failed to parse job cron expression: %s", err)
		}
		j.NextRun = s.Next(now)
		return j, nil
	}

	return initialJobRecurrenceInfo(j, now)
}

func initialJobRecurrenceInfo(j job, now time.Time) (job, error) {
	var err error

	j.RunCount = 1
	j.TotalRecurrences = 1
	j.LastRun = now
	j.NextRun = now

	if j.Schedule == nil {
		j.NextRun = now
		return j, nil
	}

	if j.RunNow {
		j.NextRun, err = time.Parse(pkg.ISOTimeFormat, j.Schedule.Start)
		if err != nil {
			return j, fmt.Errorf("failed to parse job start time: %s", err)
		}
	}

	if j.Schedule.TimeCycle == "" {
		if j.RunNow {
			j.TotalRecurrences++
		}
		return j, nil
	}

	s, err := cron.ParseStandard(j.Schedule.TimeCycle)
	if err != nil {
		return j, fmt.Errorf("failed to parse job cron expression: %s", err)
	}
	j.NextRun = s.Next(now)

	if j.Schedule.End == "" {
		// unlimited number of executions - doesn't make sense to report the number total
		j.TotalRecurrences = 0
		return j, nil
	}

	end, err := time.Parse(pkg.ISOTimeFormat, j.Schedule.End)
	if err != nil {
		return j, fmt.Errorf("failed to parse end job time: %s", err)
	}

	t := j.NextRun
	numExecs := int64(0)
	for t.Before(end) || t.Equal(end) {
		t = s.Next(t)
		numExecs++
	}
	j.TotalRecurrences = numExecs
	if j.RunNow {
		j.TotalRecurrences += 1
	}
	return j, nil
}
