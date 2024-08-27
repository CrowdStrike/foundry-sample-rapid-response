package processor

import (
	"encoding/json"
	"log/slog"
	"time"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/pkg"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func jobExecRespJSON(page *paging, j []pkg.JobExecution, e []fdk.APIError, logger *slog.Logger) []byte {
	if j == nil {
		j = make([]pkg.JobExecution, 0)
	}
	r := jobExecutionResponse{Errs: e, Resources: j}
	if page != nil {
		r.Meta = *page
	}
	rJSON, err := json.Marshal(r)
	if err != nil {
		logger.Error("failed to serialize response: " + err.Error())
		return nil
	}
	return rJSON
}

func nowT() time.Time {
	return time.Now().UTC()
}
