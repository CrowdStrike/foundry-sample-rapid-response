package models

import (
	"context"
	"strings"

	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

type Config struct {
	Cloud                           falcon.CloudType
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
func FalconClient(ctx context.Context, cloud falcon.CloudType, accessToken string) (*client.CrowdStrikeAPISpecification, error) {
	token := strings.TrimSpace(accessToken)
	if token == "" {
		return falcon.NewClient(&falcon.ApiConfig{
			AccessToken: token,
			Cloud:       cloud,
			Context:     context.Background(),
			Debug:       true,
		})
	}
	return falcon.NewClient(&falcon.ApiConfig{
		AccessToken: token,
		Cloud:       cloud,
		Context:     ctx,
	})
}
