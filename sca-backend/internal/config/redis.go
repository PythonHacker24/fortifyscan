package config

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

// InitRedis initializes the Redis client
func InitRedis() *redis.Client {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	// Test the connection
	ctx := context.Background()
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
		log.Println("Continuing without Redis - stats will not persist")
		return nil
	}

	// Initialize counters if they don't exist
	rdb.SetNX(ctx, "visitors", 0, 0)
	rdb.SetNX(ctx, "analyses", 0, 0)
	log.Println("Redis connection established")

	return rdb
}
