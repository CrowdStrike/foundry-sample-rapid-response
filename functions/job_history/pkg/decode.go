package pkg

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"regexp"
	"strings"
)

var nonAlphaNumericRE = regexp.MustCompile("[^a-zA-Z0-9]")

// DecodeBase64JSON takes a slice of bytes which contains a base64 encoded JSON string
// and decodes it back into a JSON string.
func DecodeBase64JSON(data []byte) ([]byte, error) {
	var err error
	if len(data) == 0 {
		return make([]byte, 0), nil
	}
	if data[0] == '"' {
		// drop leading and trailing quotes
		data = bytes.Trim(bytes.TrimSpace(data), `"`)
	}
	if data[0] != '{' {
		// if base64 convert back to general string
		data, err = base64.StdEncoding.DecodeString(string(bytes.TrimSpace(data)))
		if err != nil {
			return nil, err
		}
	}
	return data, nil
}

// NormalizeJobStatus converts a string containing a believed job status into a string expected by this app.
func NormalizeJobStatus(status string) string {
	status = strings.ToLower(strings.TrimSpace(status))
	status = nonAlphaNumericRE.ReplaceAllString(status, "")
	switch status {
	case StatusCompleted, "succeeded":
		return StatusCompleted
	case "inprogress", "progress":
		return StatusInProgress
	case "failed":
		return StatusFailed
	}
	return ""
}

// DecodeJobExecution converts a byte slice into a JobExecution instance.
func DecodeJobExecution(data []byte) (JobExecution, error) {
	var j JobExecution

	data, err := DecodeBase64JSON(data)
	if err != nil {
		return JobExecution{}, err
	}
	if err = json.Unmarshal(data, &j); err != nil {
		return JobExecution{}, err
	}

	j.RunStatus = NormalizeJobStatus(j.RunStatus)

	return j, nil
}
