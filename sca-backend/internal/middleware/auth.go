package middleware

import (
	"net/http"
	"sca-backend/internal/handlers"
)

// AuthMiddleware verifies the API key in requests
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get API key from header
		clientAPIKey := r.Header.Get("X-API-Key")

		// Check if API key is provided and matches
		if clientAPIKey == "" {
			handlers.SendError(w, "API key is required", http.StatusUnauthorized)
			return
		}

		if clientAPIKey != handlers.GetAPIKey() {
			handlers.SendError(w, "Invalid API key", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}
