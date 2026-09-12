package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Conversation represents a conversation (DM or Group).
type Conversation struct {
	ID          string               `json:"id"`
	Type        string               `json:"type"`
	Name        string               `json:"name"`
	AvatarURL   string               `json:"avatar_url"`
	CreatedBy   string               `json:"created_by"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
	Members     []ConversationMember `json:"members"`
	LastMessage *Message             `json:"last_message,omitempty"`
	UnreadCount int                  `json:"unread_count"`
}

// ConversationMember is a member of a conversation.
type ConversationMember struct {
	UserID     string     `json:"user_id"`
	UserName   string     `json:"user_name"`
	UserEmail  string     `json:"user_email"`
	UserAvatar string     `json:"user_avatar"`
	JoinedAt   time.Time  `json:"joined_at"`
	LastReadAt *time.Time `json:"last_read_at,omitempty"`
}

// ConversationRepo handles all conversation DB operations.
type ConversationRepo struct {
	db *pgxpool.Pool
}

// NewConversationRepo creates a ConversationRepo.
func NewConversationRepo(db *pgxpool.Pool) *ConversationRepo {
	return &ConversationRepo{db: db}
}

// Create inserts a new conversation and its initial members in a transaction.
func (r *ConversationRepo) Create(ctx context.Context, convType, name, avatarURL, createdByID string, members []ConversationMember) (*Conversation, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var conv Conversation
	err = tx.QueryRow(ctx, `
		INSERT INTO conversations (type, name, avatar_url, created_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, type, COALESCE(name,''), COALESCE(avatar_url,''), created_by, created_at, updated_at`,
		convType, name, avatarURL, createdByID,
	).Scan(&conv.ID, &conv.Type, &conv.Name, &conv.AvatarURL, &conv.CreatedBy, &conv.CreatedAt, &conv.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create conversation: %w", err)
	}

	for _, m := range members {
		_, err = tx.Exec(ctx, `
			INSERT INTO conversation_members (conversation_id, user_id, user_name, user_email, user_avatar)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT DO NOTHING`,
			conv.ID, m.UserID, m.UserName, m.UserEmail, m.UserAvatar)
		if err != nil {
			return nil, fmt.Errorf("failed to add member %s: %w", m.UserID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	conv.Members = members
	return &conv, nil
}

// FindDM looks for an existing DM conversation between two users.
func (r *ConversationRepo) FindDM(ctx context.Context, userID1, userID2 string) (*Conversation, error) {
	var conv Conversation
	err := r.db.QueryRow(ctx, `
		SELECT c.id, c.type, COALESCE(c.name,''), COALESCE(c.avatar_url,''), c.created_by, c.created_at, c.updated_at
		FROM conversations c
		JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
		JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
		WHERE c.type = 'DM'
		LIMIT 1`, userID1, userID2,
	).Scan(&conv.ID, &conv.Type, &conv.Name, &conv.AvatarURL, &conv.CreatedBy, &conv.CreatedAt, &conv.UpdatedAt)
	if err != nil {
		return nil, err // pgx.ErrNoRows if not found
	}
	conv.Members, _ = r.GetMembers(ctx, conv.ID)
	return &conv, nil
}

// GetByID returns a single conversation with its members.
func (r *ConversationRepo) GetByID(ctx context.Context, conversationID string) (*Conversation, error) {
	var conv Conversation
	err := r.db.QueryRow(ctx, `
		SELECT id, type, COALESCE(name,''), COALESCE(avatar_url,''), created_by, created_at, updated_at
		FROM conversations WHERE id = $1`, conversationID,
	).Scan(&conv.ID, &conv.Type, &conv.Name, &conv.AvatarURL, &conv.CreatedBy, &conv.CreatedAt, &conv.UpdatedAt)
	if err != nil {
		return nil, err
	}

	conv.Members, err = r.GetMembers(ctx, conversationID)
	return &conv, err
}

// ListForUser returns all conversations the user is a member of, ordered by latest activity.
func (r *ConversationRepo) ListForUser(ctx context.Context, userID string) ([]*Conversation, error) {
	rows, err := r.db.Query(ctx, `
		SELECT c.id, c.type, COALESCE(c.name,''), COALESCE(c.avatar_url,''), c.created_by, c.created_at, c.updated_at
		FROM conversations c
		JOIN conversation_members cm ON cm.conversation_id = c.id
		WHERE cm.user_id = $1
		ORDER BY c.updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	convs := []*Conversation{}
	for rows.Next() {
		var conv Conversation
		if err := rows.Scan(&conv.ID, &conv.Type, &conv.Name, &conv.AvatarURL, &conv.CreatedBy, &conv.CreatedAt, &conv.UpdatedAt); err != nil {
			return nil, err
		}
		convs = append(convs, &conv)
	}

	// Load members for each conversation
	for _, conv := range convs {
		conv.Members, _ = r.GetMembers(ctx, conv.ID)
	}

	return convs, rows.Err()
}

// GetMembers returns all members of a conversation.
func (r *ConversationRepo) GetMembers(ctx context.Context, conversationID string) ([]ConversationMember, error) {
	rows, err := r.db.Query(ctx, `
		SELECT user_id, COALESCE(user_name,''), COALESCE(user_email,''), COALESCE(user_avatar,''), joined_at, last_read_at
		FROM conversation_members WHERE conversation_id = $1`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []ConversationMember
	for rows.Next() {
		var m ConversationMember
		if err := rows.Scan(&m.UserID, &m.UserName, &m.UserEmail, &m.UserAvatar, &m.JoinedAt, &m.LastReadAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

// GetMemberIDs returns just the user IDs of all members of a conversation.
func (r *ConversationRepo) GetMemberIDs(ctx context.Context, conversationID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `
		SELECT user_id FROM conversation_members WHERE conversation_id = $1`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// IsMember checks if a user is a member of the conversation.
func (r *ConversationRepo) IsMember(ctx context.Context, conversationID, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2)`,
		conversationID, userID).Scan(&exists)
	return exists, err
}

// AddMember adds a user to a group conversation.
func (r *ConversationRepo) AddMember(ctx context.Context, conversationID string, member ConversationMember) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO conversation_members (conversation_id, user_id, user_name, user_email, user_avatar)
		VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
		conversationID, member.UserID, member.UserName, member.UserEmail, member.UserAvatar)
	return err
}

// RemoveMember removes a user from a group conversation.
func (r *ConversationRepo) RemoveMember(ctx context.Context, conversationID, userID string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
		conversationID, userID)
	return err
}

// UpdateTimestamp updates the conversation's updated_at timestamp (called when a message is sent).
func (r *ConversationRepo) UpdateTimestamp(ctx context.Context, conversationID string) {
	r.db.Exec(ctx, `UPDATE conversations SET updated_at = NOW() WHERE id = $1`, conversationID)
}

// UpdateLastRead updates the member's last_read_at timestamp.
func (r *ConversationRepo) UpdateLastRead(ctx context.Context, conversationID, userID string) {
	r.db.Exec(ctx, `
		UPDATE conversation_members SET last_read_at = NOW()
		WHERE conversation_id = $1 AND user_id = $2`, conversationID, userID)
}

// Update updates a group's name or avatar.
func (r *ConversationRepo) Update(ctx context.Context, conversationID, name, avatarURL string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE conversations SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`,
		name, avatarURL, conversationID)
	return err
}
