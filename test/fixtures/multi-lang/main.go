package main

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds application configuration
type Config struct {
	DatabaseURL string
	DBPoolSize  int
	APIKey      string
	APISecret   string
	APIEndpoint string
	RedisHost   string
	RedisPort   int
	Port        int
	NodeEnv     string
	LogLevel    string
}

func main() {
	// Database configuration
	databaseURL := os.Getenv("DATABASE_URL")
	dbPoolSize, _ := strconv.Atoi(os.Getenv("DB_POOL_SIZE"))
	
	// API configuration
	apiKey := os.Getenv("API_KEY")
	apiSecret := os.Getenv("API_SECRET")
	apiEndpoint := os.Getenv("API_ENDPOINT")
	
	// Redis configuration
	redisHost := os.Getenv("REDIS_HOST")
	redisPort, _ := strconv.Atoi(os.Getenv("REDIS_PORT"))
	redisPassword := os.Getenv("REDIS_PASSWORD")
	
	// Application settings
	nodeEnv := os.Getenv("NODE_ENV")
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	logLevel := os.Getenv("LOG_LEVEL")
	
	// Feature flags
	enableCaching := os.Getenv("ENABLE_CACHING")
	enableAnalytics := os.Getenv("ENABLE_ANALYTICS")
	
	// AWS configuration
	awsRegion := os.Getenv("AWS_REGION")
	awsAccessKeyID, exists := os.LookupEnv("AWS_ACCESS_KEY_ID")
	awsSecretAccessKey, _ := os.LookupEnv("AWS_SECRET_ACCESS_KEY")
	
	// Missing variables (not in .env.example)
	githubToken := os.Getenv("GITHUB_TOKEN")
	dockerRegistry := os.Getenv("DOCKER_REGISTRY")
	
	config := Config{
		DatabaseURL: databaseURL,
		DBPoolSize:  dbPoolSize,
		APIKey:      apiKey,
		APISecret:   apiSecret,
		APIEndpoint: apiEndpoint,
		RedisHost:   redisHost,
		RedisPort:   redisPort,
		Port:        port,
		NodeEnv:     nodeEnv,
		LogLevel:    logLevel,
	}
	
	fmt.Printf("Config: %+v\n", config)
	fmt.Printf("AWS: %s, %s, %v\n", awsRegion, awsAccessKeyID, exists)
	fmt.Printf("Redis password: %s\n", redisPassword)
	fmt.Printf("Flags: %s, %s\n", enableCaching, enableAnalytics)
	fmt.Printf("Missing: %s, %s\n", githubToken, dockerRegistry)
}
