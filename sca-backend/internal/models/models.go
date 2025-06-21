package models

// Stats maintains visitor and analysis counts
type Stats struct {
	Visitors int `json:"visitors"`
	Analyses int `json:"analyses"`
}

// CodeRequest represents the request body from client
type CodeRequest struct {
	Code string `json:"code"`
}

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

// DigitalOceanMessage represents a message in the DigitalOcean AI API
type DigitalOceanMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// DigitalOceanRequest represents the request to DigitalOcean AI API
type DigitalOceanRequest struct {
	Messages    []DigitalOceanMessage `json:"messages"`
	MaxTokens   int                   `json:"max_completion_tokens,omitempty"`
	Temperature float64               `json:"temperature,omitempty"`
}

// DigitalOceanResponse represents the response from DigitalOcean AI API
type DigitalOceanResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// ApiErrorResponse represents the error response structure
type ApiErrorResponse struct {
	Message string `json:"message"`
}

// FeedbackRequest represents the feedback data from client
type FeedbackRequest struct {
	Liked   bool   `json:"liked"`
	Comment string `json:"comment"`
}

// FixIssuesResponse represents the response from the fix issues agent endpoint
// success: whether the fix was successful
// diff: the code diff as a string
// explanation: explanation of the fix
// confidence: confidence score as integer
// changelog: changelog of the fix
type FixIssuesResponse struct {
	Success     bool   `json:"success"`
	Diff        string `json:"diff"`
	Explanation string `json:"explanation"`
	Confidence  int    `json:"confidence"`
	Changelog   string `json:"changelog"`
}
