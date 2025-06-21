package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("=== FixIssues API Debug ===")

	// Check environment variables
	apiKey := os.Getenv("DIGITALOCEAN_FIX_API_KEY")
	analysisApiKey := os.Getenv("DIGITALOCEAN_API_KEY")

	fmt.Printf("DIGITALOCEAN_FIX_API_KEY present: %t (length: %d)\n", len(apiKey) > 0, len(apiKey))
	fmt.Printf("DIGITALOCEAN_API_KEY present: %t (length: %d)\n", len(analysisApiKey) > 0, len(analysisApiKey))

	if apiKey == "" {
		fmt.Println("❌ DIGITALOCEAN_FIX_API_KEY is not set!")
		fmt.Println("Please set the environment variable:")
		fmt.Println("export DIGITALOCEAN_FIX_API_KEY=your_api_key_here")
	} else {
		fmt.Println("✅ DIGITALOCEAN_FIX_API_KEY is set")
	}

	if analysisApiKey == "" {
		fmt.Println("❌ DIGITALOCEAN_API_KEY is not set!")
	} else {
		fmt.Println("✅ DIGITALOCEAN_API_KEY is set")
	}

	fmt.Println("\n=== Environment Check Complete ===")
}
