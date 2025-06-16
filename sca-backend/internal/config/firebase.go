package config

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var (
	FirebaseApp  *firebase.App
	FirebaseAuth *auth.Client
)

// InitFirebase initializes Firebase and Firebase Auth
func InitFirebase() error {
	opt := option.WithCredentialsFile("firebase-credentials.json")
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return fmt.Errorf("error initializing firebase: %v", err)
	}
	FirebaseApp = app

	// Initialize Firebase Auth
	client, err := app.Auth(context.Background())
	if err != nil {
		return fmt.Errorf("error initializing firebase auth: %v", err)
	}
	FirebaseAuth = client

	return nil
}
