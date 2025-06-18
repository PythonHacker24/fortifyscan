package config

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

const (
	configFileName = ".raincheck"
	keySize        = 32 // 256 bits for AES-256
)

type Config struct {
	APIKey string `json:"api_key"`
}

// generateKey generates a random encryption key
func generateKey() ([]byte, error) {
	key := make([]byte, keySize)
	if _, err := rand.Read(key); err != nil {
		return nil, fmt.Errorf("failed to generate key: %w", err)
	}
	return key, nil
}

// getOrCreateKey retrieves the encryption key or creates a new one
func getOrCreateKey() ([]byte, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}

	keyPath := filepath.Join(homeDir, ".raincheck_key")

	// Try to read existing key
	if key, err := os.ReadFile(keyPath); err == nil {
		return key, nil
	}

	// Generate new key if none exists
	key, err := generateKey()
	if err != nil {
		return nil, err
	}

	// Save the new key
	if err := os.WriteFile(keyPath, key, 0600); err != nil {
		return nil, fmt.Errorf("failed to save key: %w", err)
	}

	return key, nil
}

// SaveAPIKey encrypts and saves the API key
func SaveAPIKey(apiKey string) error {
	key, err := getOrCreateKey()
	if err != nil {
		return err
	}

	// Create cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return fmt.Errorf("failed to create GCM: %w", err)
	}

	// Create nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt the API key
	config := Config{APIKey: apiKey}
	configBytes, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, configBytes, nil)

	// Save to file
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	configPath := filepath.Join(homeDir, configFileName)
	if err := os.WriteFile(configPath, ciphertext, 0600); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

// GetAPIKey retrieves and decrypts the API key
func GetAPIKey() (string, error) {
	key, err := getOrCreateKey()
	if err != nil {
		return "", err
	}

	// Read encrypted config
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}

	configPath := filepath.Join(homeDir, configFileName)
	ciphertext, err := os.ReadFile(configPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", fmt.Errorf("no API key found. Please run 'raincheck login <apikey>' first")
		}
		return "", fmt.Errorf("failed to read config: %w", err)
	}

	// Create cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Extract nonce
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	// Unmarshal config
	var config Config
	if err := json.Unmarshal(plaintext, &config); err != nil {
		return "", fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return config.APIKey, nil
}
