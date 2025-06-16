package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"sca-backend/internal/config"
)

// GenerateAPIKey generates a new API key for a user
func GenerateAPIKey(userID string) (string, error) {
	if config.FirebaseApp == nil {
		return "", fmt.Errorf("firebase not initialized")
	}

	// Generate a random 32-byte key
	keyBytes := make([]byte, 32)
	if _, err := rand.Read(keyBytes); err != nil {
		return "", fmt.Errorf("error generating random bytes: %v", err)
	}
	apiKey := hex.EncodeToString(keyBytes)

	// Get Firestore client
	client, err := config.FirebaseApp.Firestore(context.Background())
	if err != nil {
		return "", fmt.Errorf("error getting firestore client: %v", err)
	}
	defer client.Close()

	// Create a new document in the api_keys collection
	docRef := client.Collection("api_keys").Doc(userID)
	_, err = docRef.Set(context.Background(), map[string]interface{}{
		"key":       apiKey,
		"createdAt": time.Now(),
		"userId":    userID,
	})
	if err != nil {
		return "", fmt.Errorf("error storing API key: %v", err)
	}

	return apiKey, nil
}

// GetAPIKey retrieves the API key for a user
func GetAPIKey(userID string) (string, error) {
	if config.FirebaseApp == nil {
		return "", fmt.Errorf("firebase not initialized")
	}

	client, err := config.FirebaseApp.Firestore(context.Background())
	if err != nil {
		return "", fmt.Errorf("error getting firestore client: %v", err)
	}
	defer client.Close()

	doc, err := client.Collection("api_keys").Doc(userID).Get(context.Background())
	if err != nil {
		return "", fmt.Errorf("error getting API key: %v", err)
	}

	data := doc.Data()
	key, ok := data["key"].(string)
	if !ok {
		return "", fmt.Errorf("invalid API key format")
	}

	return key, nil
}

// DeleteAPIKey deletes the API key for a user
func DeleteAPIKey(userID string) error {
	if config.FirebaseApp == nil {
		return fmt.Errorf("firebase not initialized")
	}

	client, err := config.FirebaseApp.Firestore(context.Background())
	if err != nil {
		return fmt.Errorf("error getting firestore client: %v", err)
	}
	defer client.Close()

	_, err = client.Collection("api_keys").Doc(userID).Delete(context.Background())
	if err != nil {
		return fmt.Errorf("error deleting API key: %v", err)
	}

	return nil
}
