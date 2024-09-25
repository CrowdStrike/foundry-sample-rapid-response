package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/processor"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/searchc"
	"github.com/Crowdstrike/foundry-sample-rapid-response/functions/job_history/storagec"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func main() {
	cloud := fdk.FalconClientOpts().Cloud

	var falconHost string
	switch cloud {
	case "us-1":
		falconHost = "falcon.crowdstrike.com"
	case "us-2":
		falconHost = "falcon.us-2.crowdstrike.com"
	case "eu-1":
		falconHost = "falcon.eu-1.crowdstrike.com"
	}

	falconCloud := falcon.Cloud(cloud)

	fdk.Run(context.Background(), func(_ context.Context, logger *slog.Logger, _ fdk.SkipCfg) fdk.Handler {
		recoverer := withRecoverer(logger)

		mux := fdk.NewMux()
		mux.Get("/run-history", recoverer(runHistoryHandler(logger, falconCloud)))
		mux.Put("/upsert", recoverer(upsertHandler(logger, falconCloud, falconHost)))
		return mux
	})
}

func runHistoryHandler(logger *slog.Logger, falconCloud falcon.CloudType) fdk.Handler {
	return fdk.HandlerFn(func(ctx context.Context, r fdk.Request) fdk.Response {
		p, err := newExecutionsProcessor(ctx, logger, falconCloud, r.AccessToken)
		if err != nil {
			msg := fmt.Sprintf("failed to initialize job history processor: %s", err)
			return fdk.Response{
				Errors: []fdk.APIError{{Code: 500, Message: msg}},
			}
		}
		resp := p.Process(ctx, r)
		if len(resp.Errs) > 0 {
			return fdk.Response{
				Code:   resp.Code,
				Errors: resp.Errs,
			}
		}
		return fdk.Response{
			Body: json.RawMessage(resp.Body),
			Code: resp.Code,
		}
	})
}

func upsertHandler(logger *slog.Logger, falconCloud falcon.CloudType, falconHost string) fdk.Handler {
	return fdk.HandlerFn(func(ctx context.Context, r fdk.Request) fdk.Response {
		u, err := newUpsertProcessor(ctx, logger, falconCloud, falconHost, r.AccessToken)
		if err != nil {
			msg := fmt.Sprintf("failed to initialize job upsert processor: %s", err)
			return fdk.Response{
				Errors: []fdk.APIError{{Code: 500, Message: msg}},
			}
		}

		resp := u.Process(ctx, r)
		if len(resp.Errs) > 0 {
			return fdk.Response{
				Code:   resp.Code,
				Errors: resp.Errs,
			}
		}

		return fdk.Response{
			Body: json.RawMessage(resp.Body),
			Code: resp.Code,
		}
	})
}

func withRecoverer(logger *slog.Logger) func(fdk.Handler) fdk.Handler {
	return func(next fdk.Handler) fdk.Handler {
		return fdk.HandlerFn(func(ctx context.Context, r fdk.Request) (resp fdk.Response) {
			defer func() {
				p := recover()
				if p == nil {
					return
				}

				msg := ""
				if s, ok := p.(fmt.Stringer); ok {
					msg = fmt.Sprintf("fatal error: %s", s)
				} else if e, ok := p.(error); ok {
					msg = fmt.Sprintf("fatal error: %s", e.Error())
				} else {
					msg = fmt.Sprintf("fatal error: %v", p)
				}
				logger.Error(msg)

				resp = fdk.ErrResp(fdk.APIError{Code: http.StatusInternalServerError, Message: msg})
			}()

			return next.Handle(ctx, r)
		})
	}
}

func newFalconClient(ctx context.Context, falconCloud falcon.CloudType, token string) (*client.CrowdStrikeAPISpecification, error) {
	config := &falcon.ApiConfig{
		AccessToken: token,
		Cloud:       falconCloud,
		Context:     ctx,
		Debug:       os.Getenv("DEBUG") != "",
	}
	fc, err := falcon.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create falcon client with error: %w", err)
	}
	return fc, nil
}

func newSearchClient(logger *slog.Logger, fc *client.CrowdStrikeAPISpecification) searchc.SearchC {
	return searchc.NewClient(fc.SavedSearches, logger)
}

func newStorageClient(fc *client.CrowdStrikeAPISpecification, logger *slog.Logger, token string) storagec.StorageC {
	hc := http.DefaultClient
	hc.Timeout = 10 * time.Second
	return storagec.NewClient(fc.CustomStorage, hc, token, logger)
}

func newExecutionsProcessor(ctx context.Context, logger *slog.Logger, falconCloud falcon.CloudType, token string) (*processor.ExecutionsProcessor, error) {
	fc, err := newFalconClient(ctx, falconCloud, token)
	if err != nil {
		return nil, err
	}
	strg := newStorageClient(fc, logger, token)
	return processor.NewExecutionsProcessor(strg, logger), nil
}

func newUpsertProcessor(ctx context.Context, logger *slog.Logger, falconCloud falcon.CloudType, falconHost, token string) (*processor.UpsertProcessor, error) {
	fc, err := newFalconClient(ctx, falconCloud, token)
	if err != nil {
		return nil, err
	}
	srchc := newSearchClient(logger, fc)
	strgc := newStorageClient(fc, logger, token)

	return processor.NewUpsertProcessor(falconHost, srchc, strgc, logger), nil
}
