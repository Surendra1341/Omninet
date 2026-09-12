package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// UserPresence holds a user's presence data.
type UserPresence struct {
	UserID   string
	LastSeen time.Time
	Status   string // "ONLINE" | "OFFLINE"
}

// PresenceRepo handles user presence database operations.
type PresenceRepo struct {
	db *pgxpool.Pool
}

// NewPresenceRepo creates a PresenceRepo.
func NewPresenceRepo(db *pgxpool.Pool) *PresenceRepo {
	return &PresenceRepo{db: db}
}

// Upsert inserts or updates a user's presence record.
func (r *PresenceRepo) Upsert(ctx context.Context, userID, status string) {
	r.db.Exec(ctx, `
		INSERT INTO user_presence (user_id, status, last_seen)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id) DO UPDATE SET status = $2, last_seen = NOW()`,
		userID, status)
}

// GetMultiple returns presence records for a list of user IDs.
func (r *PresenceRepo) GetMultiple(ctx context.Context, userIDs []string) ([]*UserPresence, error) {
	if len(userIDs) == 0 {
		return nil, nil
	}

	rows, err := r.db.Query(ctx, `
		SELECT user_id, last_seen, status
		FROM user_presence WHERE user_id = ANY($1)`, userIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*UserPresence
	for rows.Next() {
		var p UserPresence
		if err := rows.Scan(&p.UserID, &p.LastSeen, &p.Status); err != nil {
			return nil, err
		}
		results = append(results, &p)
	}
	return results, rows.Err()
}
