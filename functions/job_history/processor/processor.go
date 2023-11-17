package processor

import (
	"encoding/json"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/pkg"
	"github.com/sirupsen/logrus"
)

func jobExecRespJSON(page *paging, j []pkg.JobExecution, e []fdk.APIError, logger logrus.FieldLogger) []byte {
	if j == nil {
		j = make([]pkg.JobExecution, 0)
	}
	r := jobExecutionResponse{Errs: e, Resources: j}
	if page != nil {
		r.Meta = *page
	}
	rJSON, err := json.Marshal(r)
	if err != nil {
		logger.Errorf("failed to serialize response: %s", err)
		return nil
	}
	return rJSON
}

func nowT() time.Time {
	return time.Now().UTC()
}
