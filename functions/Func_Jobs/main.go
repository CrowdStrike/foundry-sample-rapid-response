package main

import (
	"context"
	"log/slog"
	"os"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	api2 "github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/sirupsen/logrus"
)

const (
	upsertJob       = "/upsert-job"
	getJob          = "/job"
	getListOfJob    = "/jobs"
	getListOfAudits = "/audits"
)

var (
	logger      logrus.FieldLogger
	falconCloud falcon.CloudType
)

func doInit(cloud string) {
	l := logrus.New()
	l.SetFormatter(&logrus.JSONFormatter{})
	logger = l

	falconCloud = falcon.Cloud(cloud)
}

func handler(context.Context, *slog.Logger, fdk.SkipCfg) fdk.Handler {
	conf := models.Config{
		Cloud:                           falconCloud,
		JobsCollection:                  "Jobs_Info",
		AuditLogsCollection:             "Jobs_Audit_logger",
		RemoveSystemWorkflowTemplateID:  "Remove file template",
		ExecutionNotifierWorkflow:       "Notify job execution template",
		InstallSystemWorkflowTemplateID: "Install software template",
		RemoveConditionNodeID:           "platform_is_equal_to_windows_hostname_includes_to_parameterized_host_groups_includes_to_parameterize_831608b0",
		InstallConditionNodeID:          "FROM_platform_is_equal_to_windows_hostname_includes_to_parameterized_host_groups_includes_to_parameterize_831608b0_TO_activity_check_file_exist_rtr_2_e7dcae9e",
	}

	upsertJobHandler := api2.NewUpsertJobHandler(&conf)
	jobHandler := api2.NewJobHandler(&conf)
	jobsHandler := api2.NewJobsHandler(&conf)
	auditsHandler := api2.NewAuditsHandler(&conf)

	mux := fdk.NewMux()
	mux.Get(getJob, jobHandler)
	mux.Get(getListOfAudits, auditsHandler)
	mux.Get(getListOfJob, jobsHandler)
	mux.Put(upsertJob, upsertJobHandler)
	return mux
}

func main() {
	cloud := os.Getenv("CS_CLOUD")
	doInit(cloud)
	logger.Print("running")
	fdk.Run(context.Background(), handler)
}
