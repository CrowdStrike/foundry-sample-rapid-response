package api

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/Func_Jobs/api/models"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func NewHandler(cfg models.Config) func(context.Context, *slog.Logger, fdk.SkipCfg) fdk.Handler {
	falconClientMW := withFalconClient(cfg.Cloud)
	return func(context.Context, *slog.Logger, fdk.SkipCfg) fdk.Handler {
		mux := fdk.NewMux()
		mux.Get("/audits", falconClientMW(fdk.HandlerFn(auditHandlerFn)))
		mux.Get("/job", falconClientMW(fdk.HandlerFn(handleSaveJobVersion)))
		mux.Get("/jobs", falconClientMW(fdk.HandlerFn(handleAppJobDetails)))
		mux.Put("/upsert-job", falconClientMW(handleUpsertJob(cfg)))
		return mux
	}
}

type ctxKey string

const ctxKeyFalconClient ctxKey = "falcon_client"

func withFalconClient(cloud falcon.CloudType) func(fdk.Handler) fdk.Handler {
	return func(next fdk.Handler) fdk.Handler {
		return fdk.HandlerFn(func(ctx context.Context, r fdk.Request) fdk.Response {
			fc, err := models.FalconClient(ctx, cloud, r.AccessToken)
			if err != nil {
				return fdk.ErrResp(fdk.APIError{Code: http.StatusBadRequest, Message: "failed to initialize client"})
			}

			ctx = context.WithValue(ctx, ctxKeyFalconClient, fc)

			return next.Handle(ctx, r)
		})
	}
}

func getFalconClient(ctx context.Context) *client.CrowdStrikeAPISpecification {
	fc, _ := ctx.Value(ctxKeyFalconClient).(*client.CrowdStrikeAPISpecification)
	return fc
}
