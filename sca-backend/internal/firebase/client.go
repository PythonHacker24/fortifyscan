package firebase

import (
	"context"
	"fmt"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

var (
	client *firestore.Client
)

type Handler struct {
	FirebaseClient *firebase.App // or your specific Firebase client type
}

func NewHandler(firebaseClient *firebase.App) *Handler {
	return &Handler{
		FirebaseClient: firebaseClient,
	}
}

// APIKeyData represents the structure of an API key document in Firestore
type APIKeyData struct {
	CreatedAt string `firestore:"createdAt"`
	Key       string `firestore:"key"` // The actual API key string
	UserID    string `firestore:"userId"`
	// Active    bool   `firestore:"active"`
}

// Init initializes the Firebase Firestore client
func Init() (*firestore.Client, error) {
	ctx := context.Background()

	opt := option.WithCredentialsFile("firebase-credentials.json")
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firebase app: %w", err)
	}

	client, err = app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firestore client: %w", err)
	}

	log.Println("Firestore client initialized successfully")
	return client, nil
}

// // VerifyAPIKey checks if the provided API key exists and is valid in Firestore
// func VerifyAPIKey(ctx context.Context, apiKey string) (bool, error) {
// 	if client == nil {
// 		return false, fmt.Errorf("firestore client not initialized")
// 	}

// 	iter := client.Collection("api_keys").Where("key", "==", apiKey).Limit(1).Documents(ctx)
// 	defer iter.Stop()

// 	doc, err := iter.Next()
// 	if err == iterator.Done {
// 		return false, nil // API key not found
// 	}
// 	if err != nil {
// 		return false, fmt.Errorf("error iterating documents: %w", err)
// 	}

// 	var data APIKeyData
// 	if err := doc.DataTo(&data); err != nil {
// 		return false, fmt.Errorf("error unmarshaling document data: %w", err)
// 	}

// 	return data.Active, nil // Return true if found and active
// }

// VerifyAPIKey checks if the provided API key exists in any document's key field in the api_keys collection
func VerifyAPIKey(client *firestore.Client, ctx context.Context, apiKey string) (bool, error) {
	if client == nil {
		return false, fmt.Errorf("firestore client not initialized")
	}

	iter := client.Collection("api_keys").Where("key", "==", apiKey).Limit(1).Documents(ctx)
	defer iter.Stop()

	_, err := iter.Next()
	if err == iterator.Done {
		log.Printf("Key that wasn't found in database: %s", apiKey)
		return false, fmt.Errorf("api key not found") // API key not found
	}
	if err != nil {
		return false, fmt.Errorf("error querying API key: %w", err)
	}

	// If we reach here, the API key exists
	return true, nil
}
