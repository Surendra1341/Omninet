package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Client wraps the Redis client and provides pub/sub and presence helpers.
type Client struct {
	rdb *redis.Client
	log *zap.Logger
}

// Connect creates a Redis client from a URL (e.g., redis://localhost:6379).
func Connect(redisURL string, log *zap.Logger) (*Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Redis URL: %w", err)
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Info("Connected to Redis", zap.String("url", redisURL))
	return &Client{rdb: rdb, log: log}, nil
}

// Publish sends a message to a Redis pub/sub channel.
func (c *Client) Publish(ctx context.Context, channel string, payload interface{}) error {
	return c.rdb.Publish(ctx, channel, payload).Err()
}

// Subscribe subscribes to one or more Redis pub/sub channels.
func (c *Client) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return c.rdb.Subscribe(ctx, channels...)
}

// SetPresence marks a user as online/offline in Redis with a TTL.
func (c *Client) SetPresence(ctx context.Context, userID string, online bool) error {
	key := "chat:presence:" + userID
	if online {
		// Online presence with 90-second TTL; refreshed on heartbeat/activity
		return c.rdb.Set(ctx, key, "online", 90*time.Second).Err()
	}
	// Offline: remove key
	return c.rdb.Del(ctx, key).Err()
}

// GetPresence returns true if the user is currently marked online in Redis.
func (c *Client) GetPresence(ctx context.Context, userID string) bool {
	val, err := c.rdb.Get(ctx, "chat:presence:"+userID).Result()
	return err == nil && val == "online"
}

// RefreshPresence extends the online TTL (called on each WS message).
func (c *Client) RefreshPresence(ctx context.Context, userID string) {
	c.rdb.Expire(ctx, "chat:presence:"+userID, 90*time.Second)
}

// SetTyping sets a typing indicator with a short TTL.
func (c *Client) SetTyping(ctx context.Context, conversationID, userID string) error {
	key := fmt.Sprintf("chat:typing:%s:%s", conversationID, userID)
	return c.rdb.Set(ctx, key, "1", 5*time.Second).Err()
}

// Close closes the underlying Redis connection.
func (c *Client) Close() error {
	return c.rdb.Close()
}

// Raw returns the underlying redis.Client for direct use if needed.
func (c *Client) Raw() *redis.Client {
	return c.rdb
}
