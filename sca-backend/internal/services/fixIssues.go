package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

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
	req, err := json.Marshal(requestBody)
	if err != nil {
	}
	reqStr := string(req)
	doReq := models.DigitalOceanRequest{
		Messages: []models.DigitalOceanMessage{
			{
				Role:    "user",
				Content: reqStr,
			},
		},
		MaxTokens:   2000,
		Temperature: 0.1, // Low temperature for consistent JSON output
	}
	jsonBody, err := json.Marshal(doReq)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize request: %v", err)
	}

	httpReq, err := http.NewRequest("POST", fixIssuesURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("DIGITALOCEAN_FIX_API_KEY")))

	client := &http.Client{Timeout: 60 * 1000000000}
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

	var doResponse models.DigitalOceanResponse
	if err := json.Unmarshal(respBody, &doResponse); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %v", err)
	}

	// Check for API errors
	if doResponse.Error != nil {
		return nil, fmt.Errorf("AI API error: %s", doResponse.Error.Message)
	}

	if len(doResponse.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI model")
	}

	content := doResponse.Choices[0].Message.Content
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start >= 0 && end >= 0 && end > start {
		content = content[start : end+1]
	}

	var fixResp models.FixIssuesResponse
	if err := json.Unmarshal([]byte(content), &fixResp); err != nil {
		// Fallback: create a basic response if JSON parsing fails
		fixResp = models.FixIssuesResponse{
			Success:     false,
			Diff:        "",
			Explanation: "Unable to parse AI response",
			Confidence:  1,
			Changelog:   "Failed to generate fix due to parsing error",
		}
	}

	return &fixResp, nil
}
