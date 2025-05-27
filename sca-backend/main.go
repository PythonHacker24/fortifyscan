package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	// "sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Stats maintains visitor and analysis counts
type Stats struct {
	Visitors int `json:"visitors"`
	Analyses int `json:"analyses"`
	// mu       sync.RWMutex
}

var (
	// stats         = &Stats{}
	openRouterURL = "https://openrouter.ai/api/v1/chat/completions"
	rdb           *redis.Client
	ctx           = context.Background()
	apiKey        string
)

// Initialize Redis client
func initRedis() {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: os.Getenv("REDIS_PASSWORD"), // no password by default
		DB:       0,                           // use default DB
	})

	// Test the connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Initialize counters if they don't exist
	rdb.SetNX(ctx, "visitors", 0, 0)
	rdb.SetNX(ctx, "analyses", 0, 0)
}

// Request body from client
type CodeRequest struct {
	Code string `json:"code"`
}

// Expected JSON response structures
type Issue struct {
	Severity    string `json:"severity"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Line        int    `json:"line,omitempty"`
	Suggestion  string `json:"suggestion"`
}

type Category struct {
	Score  float64 `json:"score"`
	Issues []Issue `json:"issues"`
}

type AnalysisResponse struct {
	OverallScore    float64  `json:"overall_score"`
	Security        Category `json:"security"`
	Performance     Category `json:"performance"`
	CodeQuality     Category `json:"code_quality"`
	Maintainability Category `json:"maintainability"`
	BestPractices   Category `json:"best_practices"`
	Suggestions     []string `json:"suggestions"`
}

// OpenRouter API structures
type OpenRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterRequest struct {
	Model    string              `json:"model"`
	Messages []OpenRouterMessage `json:"messages"`
}

type OpenRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// ApiErrorResponse represents the error response structure
type ApiErrorResponse struct {
	Message string `json:"message"`
}

// authMiddleware verifies the API key in requests
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get API key from header
		clientAPIKey := r.Header.Get("X-API-Key")

		// Check if API key is provided and matches
		if clientAPIKey == "" {
			sendError(w, "API key is required", http.StatusUnauthorized)
			return
		}

		if clientAPIKey != apiKey {
			sendError(w, "Invalid API key", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

// Stats handler with Redis
func statsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		visitors, err := rdb.Get(ctx, "visitors").Int()
		if err != nil {
			sendError(w, "Failed to get visitor count", http.StatusInternalServerError)
			return
		}

		analyses, err := rdb.Get(ctx, "analyses").Int()
		if err != nil {
			sendError(w, "Failed to get analysis count", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(Stats{
			Visitors: visitors,
			Analyses: analyses,
		})
		return
	}

	if r.Method == "POST" {
		var newStats Stats
		if err := json.NewDecoder(r.Body).Decode(&newStats); err != nil {
			sendError(w, "Invalid JSON input", http.StatusBadRequest)
			return
		}

		// Update Redis counters
		if err := rdb.Set(ctx, "visitors", newStats.Visitors, 0).Err(); err != nil {
			sendError(w, "Failed to update visitor count", http.StatusInternalServerError)
			return
		}

		if err := rdb.Set(ctx, "analyses", newStats.Analyses, 0).Err(); err != nil {
			sendError(w, "Failed to update analysis count", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(&newStats)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

// sendError sends a JSON error response
func sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ApiErrorResponse{
		Message: message,
	})
}

// Code analysis handler
func analyzeHandler(w http.ResponseWriter, r *http.Request) {

	// Only allow POST method for actual requests
	if r.Method != http.MethodPost {
		sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read the entire request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		sendError(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Check if the request body is too large (10MB limit)
	if len(body) > 10*1024*1024 {
		sendError(w, "Request body too large", http.StatusRequestEntityTooLarge)
		return
	}

	var req CodeRequest
	if err := json.Unmarshal(body, &req); err != nil {
		sendError(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}

	// Check if code is empty
	if req.Code == "" {
		sendError(w, "Code cannot be empty", http.StatusBadRequest)
		return
	}

	// Compose prompt for the LLM
	prompt := `You are a code review expert. Analyze the following code and respond ONLY in the following JSON format. Make sure to provide detailed, specific feedback for each category:

{
  "overall_score": float (1-10),
  "security": {
    "score": float (1-10),
    "issues": [
      {
        "severity": "high|medium|low",
        "type": "specific issue category",
        "description": "detailed description",
        "line": line number (if applicable),
        "suggestion": "specific fix suggestion"
      }
    ]
  },
  "performance": {
    "score": float (1-10),
    "issues": [...]
  },
  "code_quality": {
    "score": float (1-10),
    "issues": [...]
  },
  "maintainability": {
    "score": float (1-10),
    "issues": [...]
  },
  "best_practices": {
    "score": float (1-10),
    "issues": [...]
  },
  "suggestions": [
    "specific improvement suggestions..."
  ]
}

Code to analyze:

` + req.Code

	openRouterReq := OpenRouterRequest{
		Model: "deepseek/deepseek-r1:free",
		Messages: []OpenRouterMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonBody, err := json.Marshal(openRouterReq)
	if err != nil {
		sendError(w, "Failed to serialize request", http.StatusInternalServerError)
		return
	}

	// Send request to OpenRouter
	httpReq, err := http.NewRequest("POST", openRouterURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		sendError(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Set required headers for OpenRouter API
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("OPENROUTER_API_KEY")))

	client := &http.Client{Timeout: 30 * time.Second}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		sendError(w, "Failed to contact OpenRouter API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(httpResp.Body)
		sendError(w, fmt.Sprintf("OpenRouter API error (status %d): %s", httpResp.StatusCode, string(respBody)), http.StatusInternalServerError)
		return
	}

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		sendError(w, "Failed to read model response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Debug: Log the raw response
	log.Printf("Raw response from OpenRouter: %s", string(respBody))

	var openRouterResponse OpenRouterResponse
	if err := json.Unmarshal(respBody, &openRouterResponse); err != nil {
		sendError(w, fmt.Sprintf("Failed to parse model response: %v. Raw response: %s", err, string(respBody)), http.StatusInternalServerError)
		return
	}

	if len(openRouterResponse.Choices) == 0 {
		sendError(w, "No response from model", http.StatusInternalServerError)
		return
	}

	// Debug: Log the content we're trying to parse
	log.Printf("Attempting to parse content: %s", openRouterResponse.Choices[0].Message.Content)

	// Try to clean the response before parsing
	content := openRouterResponse.Choices[0].Message.Content
	// Find the first { and last } to extract just the JSON part
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start >= 0 && end >= 0 && end > start {
		content = content[start : end+1]
	}

	// Parse model's JSON response
	var analysis AnalysisResponse
	if err := json.Unmarshal([]byte(content), &analysis); err != nil {
		log.Printf("Failed to parse JSON content: %v", err)
		sendError(w, fmt.Sprintf("Failed to parse model's JSON output: %v. Content attempted to parse: %s", err, content), http.StatusInternalServerError)
		return
	}

	// Validate the analysis response
	if analysis.OverallScore == 0 || (len(analysis.Security.Issues) == 0 &&
		len(analysis.Performance.Issues) == 0 &&
		len(analysis.CodeQuality.Issues) == 0 &&
		len(analysis.Maintainability.Issues) == 0 &&
		len(analysis.BestPractices.Issues) == 0) {
		sendError(w, "Model returned incomplete or invalid analysis", http.StatusInternalServerError)
		return
	}

	// Update analysis count in Redis
	if err := rdb.Incr(ctx, "analyses").Err(); err != nil {
		log.Printf("Failed to increment analysis count: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}

func main() {
	// Get API tokens from environment
	apiKey = os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY environment variable not set")
	}

	openRouterKey := os.Getenv("OPENROUTER_API_KEY")
	if openRouterKey == "" {
		log.Fatal("OPENROUTER_API_KEY environment variable not set")
	}

	// Initialize Redis
	initRedis()

	// Create a new mux router
	mux := http.NewServeMux()

	// Set up routes
	mux.HandleFunc("/api/analyze-code", authMiddleware(analyzeHandler))
	mux.HandleFunc("/api/stats", authMiddleware(statsHandler))

	// Create server with timeouts
	server := &http.Server{
		Addr: ":" + getPort(),
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			mux.ServeHTTP(w, r)
		}),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Server starting on port %s", getPort())
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "1000"
	}
	return port
}
