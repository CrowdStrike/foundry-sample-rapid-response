package pkg

const (
	// ISOTimeFormat is the standard ISO-8601 time format for date and time in UTC to the second precision.
	ISOTimeFormat = "2006-01-02T15:04:05Z"
)
const (
	// StatusCompleted represents a job completed status.
	StatusCompleted = "completed"
	// StatusInProgress represents a job in-progress status.
	StatusInProgress = "in-progress"
	// StatusFailed represents a job failed status.
	StatusFailed = "failed"
)

// JobExecution represents a job execution history record.
type JobExecution struct {
	// CSVOutput contains a link to the logscale output in CSV format.
	CSVOutput string `json:"output_1"`
	// Duration is the number of hours, minutes, and seconds the job ran/has run in string format.
	Duration string `json:"duration"`
	// EndDate is the timestamp at which the job stopped executing.
	EndDate string `json:"endDate"`
	// ExecutionID is the workflow execution ID.
	ExecutionID string `json:"execution_id"`
	// Hosts is a list of hostnames on which the job ran.
	Hosts []string `json:"hosts"`
	// ID is the ID of record.
	ID string `json:"id"`
	// JobID is the ID of the RTR job.
	JobID string `json:"job_id"`
	// JobName is the name of the RTR job.
	JobName string `json:"name"`
	// LogscaleOutput is a link to the Logscale output.
	LogscaleOutput string `json:"output_2"`
	// NumHosts is the length of the Hosts slice.
	NumHosts int `json:"numHosts"`
	// ReceivedFiles is the number of systems which have received the files.
	ReceivedFiles int `json:"receivedFiles"`
	// RunDate is the timestamp at which the job began running.
	RunDate string `json:"run_date"`
	// RunStatus is the status of the job.
	RunStatus string `json:"status"`
	// TargetedHosts is a breakdown of which hosts the job ran against and the status of their execution.
	TargetedHosts []TargetedHost `json:"targeted_hosts"`
}

// TargetedHost contains information about a host against which an RTR workflow ran.
type TargetedHost struct {
	// DeviceID is the ID of the device.
	DeviceID string `json:"device_id"`
	// HostName is the name of the device.
	HostName string `json:"host_name"`
	// Status is the status of execution.
	Status string `json:"status"`
}
