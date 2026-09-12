package config

import (
	"os"
	"strconv"
)

// Config holds all runtime configuration loaded from environment variables.
type Config struct {
	// Server
	Port string

	// Database (PostgreSQL via pgx)
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT
	JWTSecret string
	JWTIssuer string

	// Kafka (optional, for event publishing)
	KafkaBrokers string

	// CORS - allowed frontend origins
	AllowedOrigins string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8085"),
		DatabaseURL:    getEnv("DB_URL", "postgresql://postgres:postgres@localhost:5432/omninet_chat"),
		RedisURL:       getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:      getEnv("JWT_SECRET", "omninet_super_secret_jwt_signing_key_that_is_at_least_256_bits_long_for_hmac_sha256"),
		JWTIssuer:      getEnv("JWT_ISSUER", "omninet-auth-service"),
		KafkaBrokers:   getEnv("KAFKA_BROKERS", "localhost:9092"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"),
	}
}

func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultValue
}
