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

const digitalOceanURL = "https://ipwpfibhdjn5nc34bk25sueu.agents.do-ai.run/api/v1/chat/completions"

// AnalyzeCode performs code analysis using DigitalOcean AI
func AnalyzeCode(code string) (*models.AnalysisResponse, error) {
	// Prepare request for DigitalOcean AI
	doReq := models.DigitalOceanRequest{
		Messages: []models.DigitalOceanMessage{
			{
				Role:    "user",
				Content: code,
			},
		},
		MaxTokens:   2000,
		Temperature: 0.1, // Low temperature for consistent JSON output
	}

	jsonBody, err := json.Marshal(doReq)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize request: %v", err)
	}

	// Send request to DigitalOcean AI
	httpReq, err := http.NewRequest("POST", digitalOceanURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set required headers for DigitalOcean AI API
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("DIGITALOCEAN_API_KEY")))

	client := &http.Client{Timeout: 60 * 1000000000} // 60 seconds
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to contact DigitalOcean AI API: %v", err)
	}
	defer httpResp.Body.Close()

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read AI response: %v", err)
	}

	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service temporarily unavailable (status %d)", httpResp.StatusCode)
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

	// Clean the response to extract JSON
	content := doResponse.Choices[0].Message.Content
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start >= 0 && end >= 0 && end > start {
		content = content[start : end+1]
	}

	// Parse AI's JSON response
	var analysis models.AnalysisResponse
	if err := json.Unmarshal([]byte(content), &analysis); err != nil {
		// Fallback: create a basic response if JSON parsing fails
		analysis = models.AnalysisResponse{
			OverallScore: 5.0,
			Security: models.Category{
				Score: 5.0,
				Issues: []models.Issue{{
					Severity:    "medium",
					Type:        "Analysis Error",
					Description: "Unable to complete full analysis due to parsing error",
					Suggestion:  "Please try again or check code format",
				}},
			},
			Performance:     models.Category{Score: 5.0, Issues: []models.Issue{}},
			CodeQuality:     models.Category{Score: 5.0, Issues: []models.Issue{}},
			Maintainability: models.Category{Score: 5.0, Issues: []models.Issue{}},
			BestPractices:   models.Category{Score: 5.0, Issues: []models.Issue{}},
			Suggestions:     []string{"Code analysis could not be completed fully"},
		}
	}

	// Validate scores are within range
	if analysis.OverallScore < 1 || analysis.OverallScore > 10 {
		analysis.OverallScore = 5.0
	}

	return &analysis, nil
}
