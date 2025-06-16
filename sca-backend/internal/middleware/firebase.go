package middleware

import (
	"context"
	"net/http"
	"strings"

	"sca-backend/internal/config"
)

// FirebaseAuthMiddleware verifies the Firebase ID token in requests
func FirebaseAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		// Verify the ID token
		token, err := config.FirebaseAuth.VerifyIDToken(context.Background(), parts[1])
		if err != nil {
			http.Error(w, "Invalid ID token", http.StatusUnauthorized)
			return
		}

		// Add the user ID to the request header
		r.Header.Set("X-User-ID", token.UID)

		next(w, r)
	}
}
