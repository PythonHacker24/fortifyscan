package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"sca-backend/internal/config"
	"sca-backend/internal/firebase"
	"sca-backend/internal/handlers"
	"sca-backend/internal/middleware"
)

func main() {
	// Get API tokens from environment
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY environment variable not set")
	}
	handlers.SetAPIKey(apiKey)

	digitalOceanKey := os.Getenv("DIGITALOCEAN_API_KEY")
	if digitalOceanKey == "" {
		log.Fatal("DIGITALOCEAN_API_KEY environment variable not set")
	}

	// Initialize Redis (with fallback if unavailable)
	rdb := config.InitRedis()
	if rdb != nil {
		handlers.SetRedisClient(rdb)
	}

	// Initialize Firebase
	if err := config.InitFirebase(); err != nil {
		log.Fatal("Failed to initialize Firebase: ", err)
	}

	fsclient, err := firebase.Init()
	if err != nil {
		log.Fatal("failed to initialize firestore for cli api keys", err.Error())
	}

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
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, X-User-ID, Authorization")
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

	analyzeHandler := handlers.NewHandler(fsclient)

	// Set up routes with CORS middleware
	mux.HandleFunc("/health", handlers.HealthHandler) // Health check endpoint (no auth required)
	mux.HandleFunc("/api/analyze-code", middleware.AuthMiddleware(analyzeHandler.AnalyzeHandler, fsclient))
	mux.HandleFunc("/api/issues/fix", middleware.AuthMiddleware(analyzeHandler.FixIssuesHandler, fsclient))
	mux.HandleFunc("/api/stats", middleware.AuthMiddleware(handlers.StatsHandler, fsclient))
	mux.HandleFunc("/api/feedback", middleware.AuthMiddleware(handlers.FeedbackHandler, fsclient))

	// API key routes (protected by Firebase Auth)
	mux.HandleFunc("/api/key/generate", middleware.FirebaseAuthMiddleware(handlers.GenerateAPIKeyHandler))
	mux.HandleFunc("/api/key", middleware.FirebaseAuthMiddleware(handlers.GetAPIKeyHandler))

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
