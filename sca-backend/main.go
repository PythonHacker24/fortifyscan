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
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Stats maintains visitor and analysis counts
type Stats struct {
	Visitors int `json:"visitors"`
	Analyses int `json:"analyses"`
	mu       sync.RWMutex
}

var (
	stats          = &Stats{}
	huggingFaceURL = "https://router.huggingface.co/sambanova/v1/chat/completions"
	rdb            *redis.Client
	ctx            = context.Background()
	apiKey         string
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

// Hugging Face API structures
type HFMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type HFRequest struct {
	Messages []HFMessage `json:"messages"`
	Model    string      `json:"model"`
	Stream   bool        `json:"stream"`
}

type HFResponse struct {
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

// corsMiddleware handles CORS headers
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from any origin in development
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Allow necessary headers
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-API-Key")
		w.Header().Set("Access-Control-Expose-Headers", "Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
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

// Combine CORS and auth middleware
func withMiddleware(handler http.HandlerFunc) http.HandlerFunc {
	return corsMiddleware(authMiddleware(handler))
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

		json.NewEncoder(w).Encode(newStats)
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
	// Only allow POST method
	if r.Method != "POST" {
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

	hfReqBody := HFRequest{
		Messages: []HFMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Model:  "DeepSeek-R1",
		Stream: false,
	}

	jsonBody, err := json.Marshal(hfReqBody)
	if err != nil {
		sendError(w, "Failed to serialize request", http.StatusInternalServerError)
		return
	}

	// Send request to Hugging Face
	hfReq, err := http.NewRequest("POST", huggingFaceURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		sendError(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Set required headers for Hugging Face API
	hfReq.Header.Set("Content-Type", "application/json")
	hfReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("HF_API_KEY")))

	client := &http.Client{Timeout: 30 * time.Second}
	hfResp, err := client.Do(hfReq)
	if err != nil {
		sendError(w, "Failed to contact inference API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer hfResp.Body.Close()

	if hfResp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(hfResp.Body)
		sendError(w, fmt.Sprintf("Model API error (status %d): %s", hfResp.StatusCode, string(respBody)), http.StatusInternalServerError)
		return
	}

	respBody, err := io.ReadAll(hfResp.Body)
	if err != nil {
		sendError(w, "Failed to read model response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Debug: Log the raw response
	log.Printf("Raw response from DeepSeek: %s", string(respBody))

	var hfResponse HFResponse
	if err := json.Unmarshal(respBody, &hfResponse); err != nil {
		sendError(w, fmt.Sprintf("Failed to parse model response: %v. Raw response: %s", err, string(respBody)), http.StatusInternalServerError)
		return
	}

	if len(hfResponse.Choices) == 0 {
		sendError(w, "No response from model", http.StatusInternalServerError)
		return
	}

	// Debug: Log the content we're trying to parse
	log.Printf("Attempting to parse content: %s", hfResponse.Choices[0].Message.Content)

	// Try to clean the response before parsing
	content := hfResponse.Choices[0].Message.Content
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

	hfAPIKey := os.Getenv("HF_API_KEY")
	if hfAPIKey == "" {
		log.Fatal("HF_API_KEY environment variable not set")
	}

	// Initialize Redis
	initRedis()

	// Set up routes with middleware
	http.HandleFunc("/api/analyze-code", withMiddleware(analyzeHandler))
	http.HandleFunc("/api/stats", withMiddleware(statsHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "1000"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
