package middleware

import (
	"context"
	"log"
	"net/http"
	"sca-backend/internal/firebase"
	"sca-backend/internal/handlers"

	"cloud.google.com/go/firestore"
)

// AuthMiddleware verifies the API key in requests against Firebase
func AuthMiddleware(next http.HandlerFunc, fsclient *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get API key from header
		apiKey := r.Header.Get("X-API-Key")
		if apiKey == "" {
			handlers.SendError(w, "API key is required", http.StatusUnauthorized)
			return
		}

		// Verify API key using Firebase
		valid, err := firebase.VerifyAPIKey(fsclient, r.Context(), apiKey)
		if err != nil {
			log.Printf("api key middleware validation error" + err.Error())
			handlers.SendError(w, "Error verifying API key", http.StatusInternalServerError)
			return
		}

		if !valid {
			handlers.SendError(w, "Invalid API key", http.StatusUnauthorized)
			return
		}

		// Add API key to context (optional, but good practice if handlers need it)
		ctx := context.WithValue(r.Context(), "apiKey", apiKey)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
