package searchc

import "time"

const (
	modeAsync = "async_offload"
)

type jobStatus struct {
	ID     string `json:"job_id,omitempty"`
	Status string `json:"status,omitempty"`
	URL    string `json:"job_url,omitempty"`
}

// SearchRequest is a request to fetch data from Logscale.
type SearchRequest struct {
	// InitialFetchPause is the duration of time to wait before polling for results.
	InitialFetchPause time.Duration
	// MaxPollAttempts is the maximum number of attempts to fetch search results before giving up.
	MaxPollAttempts int
	// SearchName is the name of the saved search.
	SearchName string
	// SearchParams are arguments to provide to the search.
	SearchParams map[string]string
}

// SearchResponse is the result of a successful search.
type SearchResponse struct {
	// Events are any events returned from Logscale.
	Events []map[string]any
	// JobID is the ID of the search job.
	JobID string
	// JobStatus is the status of the search job.
	JobStatus string
	// JobURL is the URL of the search job.
	JobURL string
}

type savedSearchFetchResource struct {
	EventCount int       `json:"event_count,omitempty"`
	Events     []any     `json:"events,omitempty"`
	Status     jobStatus `json:"job_status,omitempty"`
}
