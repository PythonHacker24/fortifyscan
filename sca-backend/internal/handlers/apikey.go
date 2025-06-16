package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"sca-backend/internal/services"
)

type APIKeyResponse struct {
	APIKey string `json:"apiKey"`
}

// GenerateAPIKeyHandler handles the generation of new API keys
func GenerateAPIKeyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from the request header (assuming it's set by Firebase Auth middleware)
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		SendError(w, "User ID is required", http.StatusUnauthorized)
		return
	}

	// Delete existing API key if it exists
	if err := services.DeleteAPIKey(userID); err != nil {
		// Log the error but continue with key generation
		log.Printf("Error deleting existing API key: %v", err)
	}

	// Generate new API key
	apiKey, err := services.GenerateAPIKey(userID)
	if err != nil {
		SendError(w, "Failed to generate API key: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIKeyResponse{
		APIKey: apiKey,
	})
}

// GetAPIKeyHandler retrieves the existing API key for a user
func GetAPIKeyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from the request header
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		SendError(w, "User ID is required", http.StatusUnauthorized)
		return
	}

	// Get existing API key
	apiKey, err := services.GetAPIKey(userID)
	if err != nil {
		// If key doesn't exist, return empty string instead of error
		if err.Error() == "error getting API key: rpc error: code = NotFound desc = Document does not exist" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(APIKeyResponse{
				APIKey: "",
			})
			return
		}
		SendError(w, "Failed to get API key: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIKeyResponse{
		APIKey: apiKey,
	})
}
