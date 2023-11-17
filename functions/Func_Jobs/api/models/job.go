package models

import (
	"encoding/hex"
	"fmt"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/robfig/cron/v3"
	"github.com/spaolacci/murmur3"
)

const (
	RunNowTimeCyclesFormat            = "%d %d */1 * *"
	DateFormat                        = "%02d-%02d-%d" // 8-28-2023
	InstallSoftware        ActionType = "installSoftware"
	RemoveFile             ActionType = "removeFile"
)

// ActionType determines the type of activity the job needs to do
type ActionType string

// String method converts enum to string
func (a ActionType) String() string {
	return string(a)
}

// SearchType determines if the action needs to check if registry key or file exist.
type SearchType string

// String method converts enum to string
func (a SearchType) String() string {
	return string(a)
}

// JobsResponse holds the response from the Handle.Jobs() function.
type JobsResponse struct {
	Resources []Job   `json:"resources" description:"resources is list of Jobs in the custom storage"`
	Meta      *Paging `json:"meta" description:"meta is the pagination info."`
}

// Paging paging metadata
type Paging struct {
	Next  string `json:"next,omitempty" description:"Next is the marker to the next page."`
	Prev  string `json:"prev,omitempty" description:"Prev is the marker to the previous page."`
	Total int    `json:"total,omitempty" description:"Total is the total number of records available."`
	Limit int    `json:"limit,omitempty" description:"Limit is the total number of records to be queried per page."`
	Count int    `json:"count,omitempty" description:"Count is the total of record in a given page."`
}

// AuditResponse holds the response of all the audit logs in descending order of creation.
type AuditResponse struct {
	Resources []Audit `json:"resources" description:"Resources is the list of Audit Info from custom storage."`
	Meta      *Paging `json:"meta,omitempty" description:"Meta is the pagination information."`
}

// Audit log for the job been created and modified
type Audit struct {
	JobName    string     `json:"job_name,omitempty" description:"JobName is name of the job created/updated."`
	ModifiedAt *time.Time `json:"modified_at,omitempty" description:"ModifiedAt time of the job modified at."`
	Version    int        `json:"version" description:"Version of the job."`
	ModifiedBy string     `json:"modified_by,omitempty" description:"ModifiedBy is username of the person modified the job"`
	Action     string     `json:"action" description:"Handle indicates if the job was created or edited."`
	ID         string     `json:"id" description:"ID of the audit log."`
	JobID      string     `json:"job_id" description:"JobID is id of the job."`
}

// JobResponse holds the job info.
type JobResponse struct {
	Resource Job `json:"resource" description:"Resource indicates Job details."`
}

// Job holds the information regarding the job
type Job struct {
	UserID           string         `json:"user_id" description:"UserID is the ID of the user who submitted the request."`
	UserName         string         `json:"user_name" description:"UserName is the username or email of the user who submitted the request."`
	ID               string         `json:"id,omitempty" description:"ID identifies a job"`
	Name             string         `json:"name" description:"Name is the name of the job."`
	Description      string         `json:"description,omitempty" description:"Description is the description of the job."`
	Version          int            `json:"version" description:"Version of the job"`
	Draft            bool           `json:"draft" description:"Draft indicates if the the job provisioned or not."`
	Notifications    []string       `json:"notifications" description:"Notifications is a list of email addresses to notify regarding this job."`
	Tags             []string       `json:"tags" description:"Tags is a list of tags to assign to this job."`
	HostCount        int            `json:"host_count" description:"HostCount gives estimates number of host targeted for this job."`
	Action           *RTRAction     `json:"action" description:"Handle contains information about the RTR put file or command."`
	Schedule         *Schedule      `json:"schedule" description:"Schedule defines when this job should execute."`
	WSchedule        *Schedule      `json:"wschedule" description:"Schedule defines when this job should execute in workflow format.""`
	Target           *TargetHost    `json:"target" description:"Target defines the systems against which the action should be performed."`
	Workflows        *WorkflowsInfo `json:"workflows" description:"Workflows created for this job"`
	RunNow           bool           `json:"run_now" description:"Indicates if we need to run the workflow now."`
	TotalRecurrences int            `json:"total_recurrences" description:"TotalRecurrences is number of times job needs to be run."`
	RunCount         int            `json:"run_count" description:"RunCount is number of time job has ran."`
	NextRun          *time.Time     `json:"next_run,omitempty" description:"NextRun indicates the next time the job will run."`
	LastRun          *time.Time     `json:"last_run,omitempty" description:"LastRun indicates the last time the job ran."`
	OutputFormat     []string       `json:"output_format" description:"OutputFormat determines the user expecting the output format to be in."`
	CreatedAt        *time.Time     `json:"created_at,omitempty" description:"CreatedAt indicates the time at which job was created."`
	UpdatedAt        *time.Time     `json:"updated_at,omitempty" description:"UpdatedAt indicates the time at which jon was updated last."`
	DeletedAt        *time.Time     `json:"deleted_at,omitempty" description:"DeletedAt indicates the time at which job was deleted"`
}

// RTRAction indicates the RTR action the job needs to do.
type RTRAction struct {
	Type ActionType `json:"type" description:"Type indicates the type of activity the job needs to run."`
	InstallSoftwareAction
	RemoveFileAction
}

// InstallSoftwareAction contains the file path to be install on a sensor.
type InstallSoftwareAction struct {
	InstallFilePath string `json:"install_file_path" description:""`
	CommandSwitch   string `json:"command_switch" description:"CommandSwitch command need to be run during installing the file."`
	FileName        string `json:"file_name" description:"FileName indicates the file to be installed on the sensor."`
}

func (action InstallSoftwareAction) validate() []fdk.APIError {
	var errs []fdk.APIError
	if len(action.FileName) == 0 {
		errs = append(errs, NewValidationError(InvalidActionConfig, fmt.Sprintf("invalid file ids: %s", action.FileName)))
	}
	return errs
}

// RemoveFileAction indicates the file path and name to be removed from the sensor
type RemoveFileAction struct {
	RemoveFileName string `json:"remove_file_name" description:"RemoveFileName indicates the name file to be removed."`
	RemoveFilePath string `json:"remove_file_path" description:"RemoveFilePath indicates the path of the file to be removed."`
}

func (action RemoveFileAction) validate() []fdk.APIError {
	var errs []fdk.APIError
	if action.RemoveFileName == "" {
		errs = append(errs, NewValidationError(InvalidActionConfig, fmt.Sprintf("invalid file name: %s", action.RemoveFileName)))
	}

	if action.RemoveFilePath == "" {
		errs = append(errs, NewValidationError(InvalidActionConfig, fmt.Sprintf("invalid file path: %s", action.RemoveFilePath)))
	}

	return errs
}

// TargetHost is the list of hostgroups/host the job needs to run against.
type TargetHost struct {
	HostGroups      []string `json:"host_groups" description:"HostGroups indicates the list of host groups."`
	Hosts           []string `json:"hosts" description:"Hosts indicates the list of host."`
	OfflineQueueing bool     `json:"offline_queueing" description:"OfflineQueueing indicates if need to target host which are offline."`
}

// Schedule contains the cron job expression along with start and end date for the job.
type Schedule struct {
	TimeCycle      string `json:"time_cycle" description:"A time cycle element specifies repeating intervals, and can be specified using using cron expressions."`
	Start          string `json:"start_date,omitempty" description:"Start date in mm-dd-yyyy format"`
	End            string `json:"end_date,omitempty" description:"End date in mm-dd-yyyy format"`
	Timezone       string `json:"-" description:"Timezone label from IANA timezone database, for example, America/Los_Angeles"`
	SkipConcurrent bool   `json:"skip_concurrent" description:"Flag indicating if concurrent execution of scheduled workflow should be skipped or not"`
}

// WorkflowsInfo indicates the workflow created for the job
type WorkflowsInfo struct {
	ScheduleWorkflow string `json:"scheduled_workflow" description:"ScheduleWorkflow is the main workflow which runs the activity on an sensor"`
	NotifierWorkflow string `json:"notifier_workflow" description:"NotifierWorkflow is the main workflow which notifies when the schedule workflow has run on all sensor."`
}

// UpsertJobRequest holds info of the job.
type UpsertJobRequest struct {
	Job
}

// UpsertJobResponse holds the response when querying a job.
type UpsertJobResponse struct {
	Resource string `json:"resource" description:""`
}

// ValidationErrorCode is the error code assigned to a specific validation error
type ValidationErrorCode int

// Operation validation errors
const (
	// JobNameIsRequired error code if job name is absent.
	JobNameIsRequired ValidationErrorCode = iota + 1001
	// NotificationEmailsRequired error code if emails are absent.
	NotificationEmailsRequired
	// JobNameChangedError error code if the name of the job changed.
	JobNameChangedError
	// JobIDGenerationFailure error code for the ID generation failure.
	JobIDGenerationFailure
	JobScheduleIsIncorrect
	InvalidJobUpdateOperation
	InvalidJobTarget
	InvalidActionType
	InvalidActionConfig
)

// Validate returns back any errors present in
func (ujr *UpsertJobRequest) Validate() []fdk.APIError {
	var errs []fdk.APIError

	if ujr.Name == "" {
		errs = append(errs, NewValidationError(JobNameIsRequired, "job name cannot be empty"))
	}

	if len(ujr.Notifications) == 0 {
		errs = append(errs, NewValidationError(NotificationEmailsRequired, "notication emails cannot be empty"))
	}

	if ujr.ID != "" {
		id, err := GenerateID(ujr.Name)
		if err != nil {
			errs = append(errs, NewValidationError(JobIDGenerationFailure, fmt.Sprintf("failed to generate id for job: %v", err)))
		}
		if id != ujr.ID {
			errs = append(errs, NewValidationError(JobNameChangedError, "job name cannot be changed"))
		}
	}

	if !ujr.Draft && ujr.Workflows != nil && ujr.Workflows.ScheduleWorkflow != "" {
		errs = append(errs, NewValidationError(InvalidJobUpdateOperation, fmt.Sprintf("once job:%s id:%s schedule it cannot be updated", ujr.Name, ujr.ID)))
	}

	if ujr.Schedule != nil {
		// Time cycle is empty for schedule once
		if ujr.Schedule.TimeCycle != "" {
			_, err := cron.ParseStandard(ujr.Schedule.TimeCycle)
			if err != nil {
				errs = append(errs, NewValidationError(JobScheduleIsIncorrect, fmt.Sprintf("invalid schedule cron expression: %v", err)))
			}
		}
		loc, locErr := time.LoadLocation(time.UTC.String())
		if locErr != nil {
			errs = append(errs, NewValidationError(JobScheduleIsIncorrect, fmt.Sprintf("invalid schedule timezone: %v", locErr)))
		} else {
			if len(ujr.Schedule.Start) > 0 {
				_, stErr := time.Parse(time.RFC3339, ujr.Schedule.Start)
				if stErr != nil {
					errs = append(errs, NewValidationError(JobScheduleIsIncorrect, fmt.Sprintf("invalid schedule start: %v", stErr)))
				}
			}
			if len(ujr.Schedule.End) > 0 {
				endDate, endErr := time.Parse(time.RFC3339, ujr.Schedule.End)
				if endErr != nil {
					errs = append(errs, NewValidationError(JobScheduleIsIncorrect, fmt.Sprintf("invalid schedule end: %v", endErr)))
				}
				//check for end date to be after than today
				if endDate.Before(time.Now().In(loc)) {
					errs = append(errs, NewValidationError(JobScheduleIsIncorrect, "invalid schedule end date should be beyond today."))
				}
			}

		}
	}

	if ujr.Target == nil {
		errs = append(errs, NewValidationError(InvalidJobTarget, "must have target host or groups"))
	} else {
		if len(ujr.Target.Hosts) == 0 && len(ujr.Target.HostGroups) == 0 {
			errs = append(errs, NewValidationError(InvalidJobTarget, "must have target host or groups"))
		}
	}

	if ujr.Action == nil {
		errs = append(errs, NewValidationError(InvalidActionType, "action cannot be empty"))
	}

	if ujr.Action != nil {
		switch ujr.Action.Type.String() {
		case InstallSoftware.String():
			errs = append(errs, ujr.Action.InstallSoftwareAction.validate()...)
		case RemoveFile.String():
			errs = append(errs, ujr.Action.RemoveFileAction.validate()...)
		default:
			errs = append(errs, NewValidationError(InvalidActionType, fmt.Sprintf("invalid action type: %s", ujr.Action.Type.String())))
		}
	}

	return errs
}

// NewValidationError creates a new msaspec.Error using the code and the message
func NewValidationError(code ValidationErrorCode, msg string) fdk.APIError {
	return NewAPIError(int(code), msg)
}

func NewAPIError(code int, msg string) fdk.APIError {
	return fdk.APIError{
		Code:    code,
		Message: msg,
	}
}

// GenerateID creates a consistent value when writing or retrieving targets
func GenerateID(key string) (string, error) {
	b := murmur3.New128()
	_, err := b.Write([]byte(key))
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b.Sum(nil)), nil
}

func NextRun(schedule *Schedule, startTime time.Time) (time.Time, error) {
	nxtSchedule, err := cron.ParseStandard(fmt.Sprintf("TZ=%s %s", schedule.Timezone, schedule.TimeCycle))
	if err != nil {
		return time.Now(), err
	}
	return nxtSchedule.Next(startTime), nil
}

// SearchObjectsRequest is a request to locate objects matching the provided filter.
type SearchObjectsRequest struct {
	// Collection is the name of the collection.
	Collection string
	// Filter is the FQL filter.
	Filter string
	// Limit is the maximum number of records to be returned.
	Limit int
	// Offset is the records offset.
	Offset int
	// Sort is the FQL sort string.
	Sort string
}

// SearchObjectsResponse contains the results of the search.
type SearchObjectsResponse struct {
	// ObjectKeys contains the keys of objects which match the search response.
	ObjectKeys []string
	// Offset is the next value to present to the API get back the next page of results.
	Offset int
	// Total is the total number of records which match the filter.
	Total int
}
