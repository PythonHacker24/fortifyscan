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
	"time"

	"github.com/redis/go-redis/v9"
)

// Stats maintains visitor and analysis counts
type Stats struct {
	Visitors int `json:"visitors"`
	Analyses int `json:"analyses"`
}

var (
	digitalOceanURL = "https://ipwpfibhdjn5nc34bk25sueu.agents.do-ai.run/api/v1/chat/completions"
	rdb             *redis.Client
	ctx             = context.Background()
	apiKey          string
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
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	// Test the connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
		log.Println("Continuing without Redis - stats will not persist")
		rdb = nil
	} else {
		// Initialize counters if they don't exist
		rdb.SetNX(ctx, "visitors", 0, 0)
		rdb.SetNX(ctx, "analyses", 0, 0)
		log.Println("Redis connection established")
	}
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

// DigitalOcean AI API structures
type DigitalOceanMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DigitalOceanRequest struct {
	Messages    []DigitalOceanMessage `json:"messages"`
	MaxTokens   int                   `json:"max_completion_tokens,omitempty"`
	Temperature float64               `json:"temperature,omitempty"`
}

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

// Health check handler
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

// Stats handler with Redis (with fallback)
func statsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		var visitors, analyses int

		if rdb != nil {
			var err error
			visitors, err = rdb.Get(ctx, "visitors").Int()
			if err != nil {
				log.Printf("Failed to get visitor count from Redis: %v", err)
				visitors = 0
			}

			analyses, err = rdb.Get(ctx, "analyses").Int()
			if err != nil {
				log.Printf("Failed to get analysis count from Redis: %v", err)
				analyses = 0
			}
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

		// Update Redis counters if available
		if rdb != nil {
			if err := rdb.Set(ctx, "visitors", newStats.Visitors, 0).Err(); err != nil {
				log.Printf("Failed to update visitor count in Redis: %v", err)
			}

			if err := rdb.Set(ctx, "analyses", newStats.Analyses, 0).Err(); err != nil {
				log.Printf("Failed to update analysis count in Redis: %v", err)
			}
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

// Code analysis handler with DigitalOcean AI
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
	if strings.TrimSpace(req.Code) == "" {
		sendError(w, "Code cannot be empty", http.StatusBadRequest)
		return
	}

	// Prepare request for DigitalOcean AI
	doReq := DigitalOceanRequest{
		Messages: []DigitalOceanMessage{
			{
				Role:    "user",
				Content: req.Code,
			},
		},
		MaxTokens:   2000,
		Temperature: 0.1, // Low temperature for consistent JSON output
	}

	jsonBody, err := json.Marshal(doReq)
	if err != nil {
		sendError(w, "Failed to serialize request", http.StatusInternalServerError)
		return
	}

	// Send request to DigitalOcean AI
	httpReq, err := http.NewRequest("POST", digitalOceanURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		sendError(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Set required headers for DigitalOcean AI API
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("DIGITALOCEAN_API_KEY")))

	client := &http.Client{Timeout: 60 * time.Second} // Increased timeout for AI processing
	httpResp, err := client.Do(httpReq)
	if err != nil {
		sendError(w, "Failed to contact DigitalOcean AI API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer httpResp.Body.Close()

	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		sendError(w, "Failed to read AI response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if httpResp.StatusCode != http.StatusOK {
		log.Printf("DigitalOcean AI API error (status %d): %s", httpResp.StatusCode, string(respBody))
		sendError(w, fmt.Sprintf("AI service temporarily unavailable (status %d)", httpResp.StatusCode), http.StatusServiceUnavailable)
		return
	}

	// Debug: Log the raw response
	log.Printf("Raw response from DigitalOcean AI: %s", string(respBody))

	var doResponse DigitalOceanResponse
	if err := json.Unmarshal(respBody, &doResponse); err != nil {
		sendError(w, fmt.Sprintf("Failed to parse AI response: %v", err), http.StatusInternalServerError)
		return
	}

	// Check for API errors
	if doResponse.Error != nil {
		sendError(w, fmt.Sprintf("AI API error: %s", doResponse.Error.Message), http.StatusInternalServerError)
		return
	}

	if len(doResponse.Choices) == 0 {
		sendError(w, "No response from AI model", http.StatusInternalServerError)
		return
	}

	// Debug: Log the content we're trying to parse
	content := doResponse.Choices[0].Message.Content
	log.Printf("Attempting to parse content: %s", content)

	// Clean the response to extract JSON
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start >= 0 && end >= 0 && end > start {
		content = content[start : end+1]
	}

	// Parse AI's JSON response
	var analysis AnalysisResponse
	if err := json.Unmarshal([]byte(content), &analysis); err != nil {
		log.Printf("Failed to parse JSON content: %v", err)
		// Fallback: create a basic response if JSON parsing fails
		analysis = AnalysisResponse{
			OverallScore: 5.0,
			Security: Category{
				Score: 5.0,
				Issues: []Issue{{
					Severity:    "medium",
					Type:        "Analysis Error",
					Description: "Unable to complete full analysis due to parsing error",
					Suggestion:  "Please try again or check code format",
				}},
			},
			Performance:     Category{Score: 5.0, Issues: []Issue{}},
			CodeQuality:     Category{Score: 5.0, Issues: []Issue{}},
			Maintainability: Category{Score: 5.0, Issues: []Issue{}},
			BestPractices:   Category{Score: 5.0, Issues: []Issue{}},
			Suggestions:     []string{"Code analysis could not be completed fully"},
		}
	}

	// Validate scores are within range
	if analysis.OverallScore < 1 || analysis.OverallScore > 10 {
		analysis.OverallScore = 5.0
	}

	// Update analysis count in Redis if available
	if rdb != nil {
		if err := rdb.Incr(ctx, "analyses").Err(); err != nil {
			log.Printf("Failed to increment analysis count: %v", err)
		}
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

	digitalOceanKey := os.Getenv("DIGITALOCEAN_API_KEY")
	if digitalOceanKey == "" {
		log.Fatal("DIGITALOCEAN_API_KEY environment variable not set")
	}

	// Initialize Redis (with fallback if unavailable)
	initRedis()

	// Create a new mux router
	mux := http.NewServeMux()

	// CORS middleware
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the origin from the request
			origin := r.Header.Get("Origin")

			// List of allowed origins
			allowedOrigins := []string{
				"http://localhost:3000",
				"https://fortifyscan.vercel.app",
				"https://fluxinc.in",
				"https://*.vercel.app", // Allow all Vercel preview deployments
			}

			// Check if the origin is allowed
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin || (strings.HasSuffix(allowedOrigin, "*") && strings.HasSuffix(origin, strings.TrimPrefix(allowedOrigin, "*"))) {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
				w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours
			}

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}

	// Set up routes with CORS middleware
	mux.HandleFunc("/health", healthHandler) // Health check endpoint (no auth required)
	mux.HandleFunc("/api/analyze-code", authMiddleware(analyzeHandler))
	mux.HandleFunc("/api/stats", authMiddleware(statsHandler))

	// Create server with proper timeouts
	server := &http.Server{
		Addr:         ":" + getPort(),
		Handler:      corsMiddleware(mux),
		ReadTimeout:  30 * time.Second,  // Increased for larger code files
		WriteTimeout: 90 * time.Second,  // Increased for AI processing time
		IdleTimeout:  120 * time.Second, // Increased for better connection handling
	}

	log.Printf("Server starting on port %s", getPort())
	log.Printf("Health check available at: http://localhost:%s/health", getPort())

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
