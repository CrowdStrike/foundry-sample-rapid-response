package models

import (
	"context"
	"strings"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

type Config struct {
	Cloud                           falcon.CloudType
	JobsCollection                  string
	AuditLogsCollection             string
	RemoveSystemWorkflowTemplateID  string
	RemoveConditionNodeID           string
	InstallSystemWorkflowTemplateID string
	InstallConditionNodeID          string
	BuildQSystemWorkflowTemplateID  string
	ExecutionNotifierWorkflow       string
}

// FalconClient returns a new instance of the GoFalcon client.
// If the client cannot be created or if there is no access token in the request,
// an error is returned.
func FalconClient(ctx context.Context, conf *Config, r fdk.Request) (*client.CrowdStrikeAPISpecification, error) {
	token := strings.TrimSpace(r.AccessToken)
	if token == "" {
		return falcon.NewClient(&falcon.ApiConfig{
			AccessToken: token,
			Cloud:       conf.Cloud,
			Context:     context.Background(),
			Debug:       true,
		})
	}
	return falcon.NewClient(&falcon.ApiConfig{
		AccessToken: token,
		Cloud:       conf.Cloud,
		Context:     ctx,
	})
}
