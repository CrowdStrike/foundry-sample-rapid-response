package main

import (
	"context"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func main() {
	cfg := models.Config{
		Cloud:                           falcon.Cloud(fdk.FalconClientOpts().Cloud),
		RemoveSystemWorkflowTemplateID:  "Remove file template",
		ExecutionNotifierWorkflow:       "Notify job execution template",
		InstallSystemWorkflowTemplateID: "Install software template",
		RemoveConditionNodeID:           "platform_is_equal_to_windows_hostname_includes_to_parameterized_host_groups_includes_to_parameterize_831608b0",
		InstallConditionNodeID:          "FROM_platform_is_equal_to_windows_hostname_includes_to_parameterized_host_groups_includes_to_parameterize_831608b0_TO_activity_check_file_exist_rtr_2_e7dcae9e",
	}
	fdk.Run(context.Background(), api.NewHandler(cfg))
}
