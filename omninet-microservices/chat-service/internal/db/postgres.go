package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// Connect creates a PostgreSQL connection pool and runs schema migrations.
func Connect(ctx context.Context, databaseURL string, log *zap.Logger) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Info("Connected to PostgreSQL", zap.String("url", maskPassword(databaseURL)))

	if err := runMigrations(ctx, pool, log); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	return pool, nil
}

// runMigrations creates all required tables if they don't exist (idempotent).
func runMigrations(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger) error {
	migrations := []string{
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

		`CREATE TABLE IF NOT EXISTS conversations (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			type        VARCHAR(10) NOT NULL CHECK (type IN ('DM', 'GROUP')),
			name        VARCHAR(255),
			avatar_url  VARCHAR(500),
			created_by  VARCHAR(255) NOT NULL,
			created_at  TIMESTAMPTZ DEFAULT NOW(),
			updated_at  TIMESTAMPTZ DEFAULT NOW()
		)`,

		`CREATE TABLE IF NOT EXISTS conversation_members (
			conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			user_id         VARCHAR(255) NOT NULL,
			user_name       VARCHAR(255),
			user_email      VARCHAR(255),
			user_avatar     VARCHAR(500),
			joined_at       TIMESTAMPTZ DEFAULT NOW(),
			last_read_at    TIMESTAMPTZ,
			PRIMARY KEY (conversation_id, user_id)
		)`,

		`CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id)`,

		`CREATE TABLE IF NOT EXISTS messages (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			sender_id       VARCHAR(255) NOT NULL,
			sender_email    VARCHAR(255) NOT NULL,
			sender_name     VARCHAR(255) NOT NULL DEFAULT '',
			sender_avatar   VARCHAR(500),
			content         TEXT NOT NULL DEFAULT '',
			type            VARCHAR(20) NOT NULL DEFAULT 'TEXT',
			reply_to_id     UUID REFERENCES messages(id),
			is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
			deleted_at      TIMESTAMPTZ,
			created_at      TIMESTAMPTZ DEFAULT NOW(),
			updated_at      TIMESTAMPTZ DEFAULT NOW()
		)`,

		`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`,

		`CREATE TABLE IF NOT EXISTS message_status (
			message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
			user_id     VARCHAR(255) NOT NULL,
			status      VARCHAR(20) NOT NULL DEFAULT 'DELIVERED',
			updated_at  TIMESTAMPTZ DEFAULT NOW(),
			PRIMARY KEY (message_id, user_id)
		)`,

		`CREATE TABLE IF NOT EXISTS message_reactions (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
			user_id     VARCHAR(255) NOT NULL,
			user_name   VARCHAR(255),
			emoji       VARCHAR(20) NOT NULL,
			created_at  TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE (message_id, user_id, emoji)
		)`,

		`CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id)`,

		`CREATE TABLE IF NOT EXISTS user_presence (
			user_id    VARCHAR(255) PRIMARY KEY,
			last_seen  TIMESTAMPTZ DEFAULT NOW(),
			status     VARCHAR(20) NOT NULL DEFAULT 'OFFLINE'
		)`,
	}

	for i, sql := range migrations {
		if _, err := pool.Exec(ctx, sql); err != nil {
			return fmt.Errorf("migration %d failed: %w\nSQL: %s", i+1, err, sql)
		}
	}

	log.Info("Database schema migrations completed successfully")
	return nil
}

// maskPassword replaces the password portion of a DB URL for safe logging.
func maskPassword(url string) string {
	if idx := indexOf(url, "@"); idx > 0 {
		if start := lastIndexOf(url[:idx], ":"); start > 0 {
			return url[:start+1] + "****" + url[idx:]
		}
	}
	return url
}

func indexOf(s, sub string) int {
	for i := 0; i < len(s)-len(sub)+1; i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

func lastIndexOf(s, sub string) int {
	last := -1
	for i := 0; i < len(s)-len(sub)+1; i++ {
		if s[i:i+len(sub)] == sub {
			last = i
		}
	}
	return last
}
