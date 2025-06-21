package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"sca-backend/internal/models"
)

const fixIssuesURL = "https://z4b7rluk7f3moqgmpducstst.agents.do-ai.run/api/v1/chat/completions"

// FixIssues sends code, suggestion, and problem to the agent and returns the fix response
func FixIssues(code, suggestion, problem string) (*models.FixIssuesResponse, error) {
	// Prepare request body
	requestBody := map[string]string{
		"code":       code,
		"suggestion": suggestion,
		"problem":    problem,
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize request: %v", err)
	}

	httpReq, err := http.NewRequest("POST", fixIssuesURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("DIGITALOCEAN_FIX_API_KEY")))

	client := &http.Client{}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to contact fix issues agent: %v", err)
	}
	defer httpResp.Body.Close()

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read agent response: %v", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("agent service temporarily unavailable (status %d)", httpResp.StatusCode)
	}

	var fixResp models.FixIssuesResponse
	if err := json.Unmarshal(respBody, &fixResp); err != nil {
		return nil, fmt.Errorf("failed to parse agent response: %v", err)
	}

	return &fixResp, nil
}
