package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"sca-backend/internal/models"
	"sca-backend/internal/services"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	rdb    *redis.Client
	ctx    = context.Background()
	apiKey string
)

type contextKey string

const ApiKeyContextKey = contextKey("apiKey")

// SetAPIKey sets the API key for the application
func SetAPIKey(key string) {
	apiKey = key
}

// SetRedisClient sets the Redis client for the application
func SetRedisClient(client *redis.Client) {
	rdb = client
}

// SendError sends a JSON error response
func SendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(models.ApiErrorResponse{
		Message: message,
	})
}

// HealthHandler handles health check requests
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

// StatsHandler handles stats-related requests
func StatsHandler(w http.ResponseWriter, r *http.Request) {
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

		json.NewEncoder(w).Encode(models.Stats{
			Visitors: visitors,
			Analyses: analyses,
		})
		return
	}

	if r.Method == "POST" {
		var newStats models.Stats
		if err := json.NewDecoder(r.Body).Decode(&newStats); err != nil {
			SendError(w, "Invalid JSON input", http.StatusBadRequest)
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

type Handler struct {
	FirebaseClient *firestore.Client // or your specific Firebase client type
}

func NewHandler(firestoreClient *firestore.Client) *Handler {
	return &Handler{
		FirebaseClient: firestoreClient,
	}
}

// AnalyzeHandler handles code analysis requests
func (h *Handler) AnalyzeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read the entire request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		SendError(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Check if the request body is too large (10MB limit)
	if len(body) > 10*1024*1024 {
		SendError(w, "Request body too large", http.StatusRequestEntityTooLarge)
		return
	}

	var req models.CodeRequest
	if err := json.Unmarshal(body, &req); err != nil {
		SendError(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}

	// Check if code is empty
	if strings.TrimSpace(req.Code) == "" {
		SendError(w, "Code cannot be empty", http.StatusBadRequest)
		return
	}

	// Get analysis from service
	analysis, err := services.AnalyzeCode(req.Code)
	if err != nil {
		SendError(w, fmt.Sprintf("Analysis failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Update analysis count in Redis if available
	if rdb != nil {
		if err := rdb.Incr(ctx, "analyses").Err(); err != nil {
			log.Printf("Failed to increment analysis count: %v", err)
		}
	}

	if h.FirebaseClient != nil {
		apiKeyVal := r.Context().Value(ApiKeyContextKey)
		apiKeyStr, ok := apiKeyVal.(string)
		if !ok || apiKeyStr == "" {
			SendError(w, "API key missing from context", http.StatusUnauthorized)
			return
		}

		scanID := uuid.New().String()
		fmt.Printf("Storing scan: apiKey=%s, scanID=%s", apiKeyStr, scanID)

		scanData := map[string]interface{}{
			"code":           req.Code,
			"analysisResult": analysis,
			"timestamp":      time.Now(),
		}

		_, err := h.FirebaseClient.Collection("code_scans").
			Doc(apiKeyStr).
			Set(ctx, map[string]interface{}{
				scanID: scanData,
			}, firestore.MergeAll)

		if err != nil {
			log.Printf("Failed to store analysis in Firestore: apiKey=%s, scanID=%s, error=%v", apiKeyStr, scanID, err)
		} else {
			log.Printf("Successfully stored analysis in Firestore: apiKey=%s, scanID=%s", apiKeyStr, scanID)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}

// FeedbackHandler handles feedback requests
func FeedbackHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var feedback models.FeedbackRequest
	if err := json.NewDecoder(r.Body).Decode(&feedback); err != nil {
		SendError(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}

	// Store feedback in Redis if available
	if rdb != nil {
		feedbackKey := fmt.Sprintf("feedback:%d", time.Now().UnixNano())
		feedbackData, err := json.Marshal(feedback)
		if err != nil {
			log.Printf("Failed to marshal feedback: %v", err)
		} else {
			if err := rdb.Set(ctx, feedbackKey, feedbackData, 0).Err(); err != nil {
				log.Printf("Failed to store feedback: %v", err)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Feedback received",
	})
}
