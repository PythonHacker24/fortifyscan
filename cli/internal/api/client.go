package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	baseURL = "http://143.244.141.172:1000"
)

// Issue represents a single code issue
type Issue struct {
	Severity    string `json:"severity"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Line        int    `json:"line,omitempty"`
	Suggestion  string `json:"suggestion"`
}

// Category represents a category of analysis
type Category struct {
	Score  float64 `json:"score"`
	Issues []Issue `json:"issues"`
}

// AnalysisResponse represents the complete analysis response
type AnalysisResponse struct {
	OverallScore    float64  `json:"overall_score"`
	Security        Category `json:"security"`
	Performance     Category `json:"performance"`
	CodeQuality     Category `json:"code_quality"`
	Maintainability Category `json:"maintainability"`
	BestPractices   Category `json:"best_practices"`
	Suggestions     []string `json:"suggestions"`
}

type Client struct {
	apiKey string
	client *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) AnalyzeCode(code string) (*AnalysisResponse, error) {
	url := fmt.Sprintf("%s/api/analyze-code", baseURL)

	// Create request body
	reqBody := map[string]string{
		"code": code,
	}
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)

	// Send request
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var analysisResp AnalysisResponse
	if err := json.Unmarshal(body, &analysisResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &analysisResp, nil
}
