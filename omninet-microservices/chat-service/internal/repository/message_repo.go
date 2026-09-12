package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/omninet/chat-service/internal/models"
)

// Message is the domain model returned by the repository.
type Message struct {
	ID             string              `json:"id"`
	ConversationID string              `json:"conversation_id"`
	SenderID       string              `json:"sender_id"`
	SenderEmail    string              `json:"sender_email"`
	SenderName     string              `json:"sender_name"`
	SenderAvatar   string              `json:"sender_avatar,omitempty"`
	Content        string              `json:"content"`
	Type           string              `json:"type"`
	ReplyToID      *string             `json:"reply_to_id,omitempty"`
	ReplyTo        *Message            `json:"reply_to,omitempty"`
	IsEdited       bool                `json:"is_edited"`
	DeletedAt      *time.Time          `json:"deleted_at,omitempty"`
	Reactions      map[string][]string `json:"reactions,omitempty"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}

// CreateMessageInput holds all data needed to insert a new message.
type CreateMessageInput struct {
	ConversationID string
	SenderID       string
	SenderEmail    string
	SenderName     string
	SenderAvatar   string
	Content        string
	Type           string
	ReplyToID      string
}

// MessageRepo handles all message database operations.
type MessageRepo struct {
	db *pgxpool.Pool
}

// NewMessageRepo creates a MessageRepo.
func NewMessageRepo(db *pgxpool.Pool) *MessageRepo {
	return &MessageRepo{db: db}
}

// Create inserts a new message and returns the persisted record.
func (r *MessageRepo) Create(ctx context.Context, input CreateMessageInput) (*Message, error) {
	var msg Message

	var replyToID *string
	if input.ReplyToID != "" {
		replyToID = &input.ReplyToID
	}

	msgType := input.Type
	if msgType == "" {
		msgType = "TEXT"
	}

	row := r.db.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, sender_id, sender_email, sender_name, sender_avatar, content, type, reply_to_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, conversation_id, sender_id, sender_email, sender_name, COALESCE(sender_avatar, ''),
		          content, type, reply_to_id, is_edited, deleted_at, created_at, updated_at`,
		input.ConversationID, input.SenderID, input.SenderEmail, input.SenderName,
		input.SenderAvatar, input.Content, msgType, replyToID,
	)

	err := row.Scan(
		&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderEmail, &msg.SenderName, &msg.SenderAvatar,
		&msg.Content, &msg.Type, &msg.ReplyToID, &msg.IsEdited, &msg.DeletedAt,
		&msg.CreatedAt, &msg.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert message: %w", err)
	}

	// Load reply-to message if present
	if msg.ReplyToID != nil {
		msg.ReplyTo, _ = r.GetByID(ctx, *msg.ReplyToID)
	}

	return &msg, nil
}

// GetByID fetches a single message by ID.
func (r *MessageRepo) GetByID(ctx context.Context, id string) (*Message, error) {
	var msg Message
	row := r.db.QueryRow(ctx, `
		SELECT id, conversation_id, sender_id, sender_email, sender_name, COALESCE(sender_avatar,''),
		       content, type, reply_to_id, is_edited, deleted_at, created_at, updated_at
		FROM messages WHERE id = $1 AND deleted_at IS NULL`, id)

	err := row.Scan(
		&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderEmail, &msg.SenderName, &msg.SenderAvatar,
		&msg.Content, &msg.Type, &msg.ReplyToID, &msg.IsEdited, &msg.DeletedAt,
		&msg.CreatedAt, &msg.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	r.populateMessageDetails(ctx, []*Message{&msg})
	return &msg, nil
}

// ListForConversation returns paginated messages for a conversation using cursor-based pagination.
// If cursor is empty, returns the latest messages. cursor should be a message ID.
func (r *MessageRepo) ListForConversation(ctx context.Context, conversationID string, cursor string, limit int) ([]*Message, error) {
	if limit <= 0 || limit > 50 {
		limit = 30
	}

	if cursor == "" {
		// First page — latest messages
		rrows, rerr := r.db.Query(ctx, `
			SELECT id, conversation_id, sender_id, sender_email, sender_name, COALESCE(sender_avatar,''),
			       content, type, reply_to_id, is_edited, deleted_at, created_at, updated_at
			FROM messages
			WHERE conversation_id = $1 AND deleted_at IS NULL
			ORDER BY created_at DESC
			LIMIT $2`, conversationID, limit)
		if rerr != nil {
			return nil, rerr
		}
		defer rrows.Close()

		var msgs []*Message
		for rrows.Next() {
			var msg Message
			if err := rrows.Scan(
				&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderEmail, &msg.SenderName, &msg.SenderAvatar,
				&msg.Content, &msg.Type, &msg.ReplyToID, &msg.IsEdited, &msg.DeletedAt,
				&msg.CreatedAt, &msg.UpdatedAt,
			); err != nil {
				return nil, err
			}
			msgs = append(msgs, &msg)
		}
		res := reverseMessages(msgs)
		r.populateMessageDetails(ctx, res)
		return res, rrows.Err()
	}

	// Cursor-based: messages before the given message ID
	rrows, rerr := r.db.Query(ctx, `
		SELECT id, conversation_id, sender_id, sender_email, sender_name, COALESCE(sender_avatar,''),
		       content, type, reply_to_id, is_edited, deleted_at, created_at, updated_at
		FROM messages
		WHERE conversation_id = $1 AND deleted_at IS NULL
		  AND created_at < (SELECT created_at FROM messages WHERE id = $2)
		ORDER BY created_at DESC
		LIMIT $3`, conversationID, cursor, limit)
	if rerr != nil {
		return nil, rerr
	}
	defer rrows.Close()

	var msgs []*Message
	for rrows.Next() {
		var msg Message
		if err := rrows.Scan(
			&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderEmail, &msg.SenderName, &msg.SenderAvatar,
			&msg.Content, &msg.Type, &msg.ReplyToID, &msg.IsEdited, &msg.DeletedAt,
			&msg.CreatedAt, &msg.UpdatedAt,
		); err != nil {
			return nil, err
		}
		msgs = append(msgs, &msg)
	}
	res := reverseMessages(msgs)
	r.populateMessageDetails(ctx, res)
	return res, rrows.Err()
}

// populateMessageDetails batch-loads emoji reactions and reply-to parent messages for a slice of messages.
func (r *MessageRepo) populateMessageDetails(ctx context.Context, msgs []*Message) {
	if len(msgs) == 0 {
		return
	}

	msgIDs := make([]string, len(msgs))
	msgMap := make(map[string]*Message, len(msgs))
	var replyIDs []string
	replyIDSet := make(map[string]bool)

	for i, m := range msgs {
		msgIDs[i] = m.ID
		msgMap[m.ID] = m
		if m.Reactions == nil {
			m.Reactions = make(map[string][]string)
		}

		if m.ReplyToID != nil && *m.ReplyToID != "" && !replyIDSet[*m.ReplyToID] {
			replyIDs = append(replyIDs, *m.ReplyToID)
			replyIDSet[*m.ReplyToID] = true
		}
	}

	// 1. Batch load reactions
	rxRows, err := r.db.Query(ctx, `
		SELECT message_id, emoji, user_id
		FROM message_reactions
		WHERE message_id = ANY($1)
		ORDER BY created_at ASC`, msgIDs)
	if err == nil {
		defer rxRows.Close()
		for rxRows.Next() {
			var mID, emoji, uID string
			if scanErr := rxRows.Scan(&mID, &emoji, &uID); scanErr == nil {
				if targetMsg, ok := msgMap[mID]; ok {
					targetMsg.Reactions[emoji] = append(targetMsg.Reactions[emoji], uID)
				}
			}
		}
	}

	// 2. Batch load reply-to messages if any
	if len(replyIDs) > 0 {
		replyMap := make(map[string]*Message, len(replyIDs))
		for _, repID := range replyIDs {
			if existing, ok := msgMap[repID]; ok {
				replyMap[repID] = existing
			}
		}

		var missingReplyIDs []string
		for _, repID := range replyIDs {
			if _, ok := replyMap[repID]; !ok {
				missingReplyIDs = append(missingReplyIDs, repID)
			}
		}

		if len(missingReplyIDs) > 0 {
			parentRows, pErr := r.db.Query(ctx, `
				SELECT id, conversation_id, sender_id, sender_email, sender_name, COALESCE(sender_avatar,''),
				       content, type, reply_to_id, is_edited, deleted_at, created_at, updated_at
				FROM messages
				WHERE id = ANY($1)`, missingReplyIDs)
			if pErr == nil {
				defer parentRows.Close()
				for parentRows.Next() {
					var parent Message
					if scanErr := parentRows.Scan(
						&parent.ID, &parent.ConversationID, &parent.SenderID, &parent.SenderEmail,
						&parent.SenderName, &parent.SenderAvatar, &parent.Content, &parent.Type,
						&parent.ReplyToID, &parent.IsEdited, &parent.DeletedAt,
						&parent.CreatedAt, &parent.UpdatedAt,
					); scanErr == nil {
						replyMap[parent.ID] = &parent
					}
				}
			}
		}

		for _, m := range msgs {
			if m.ReplyToID != nil {
				if parent, ok := replyMap[*m.ReplyToID]; ok {
					m.ReplyTo = parent
				}
			}
		}
	}
}

// Update edits a message's content (only by sender).
func (r *MessageRepo) Update(ctx context.Context, messageID, senderID, content string) (*Message, error) {
	var msg Message
	row := r.db.QueryRow(ctx, `
		UPDATE messages
		SET content = $1, is_edited = TRUE, updated_at = NOW()
		WHERE id = $2 AND sender_id = $3 AND deleted_at IS NULL
		RETURNING id, conversation_id, sender_id, sender_email, sender_name, COALESCE(sender_avatar,''),
		          content, type, reply_to_id, is_edited, deleted_at, created_at, updated_at`,
		content, messageID, senderID)

	err := row.Scan(
		&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderEmail, &msg.SenderName, &msg.SenderAvatar,
		&msg.Content, &msg.Type, &msg.ReplyToID, &msg.IsEdited, &msg.DeletedAt,
		&msg.CreatedAt, &msg.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("message not found or not owned by sender: %w", err)
	}
	return &msg, nil
}

// SoftDelete marks a message as deleted (unsend for everyone).
func (r *MessageRepo) SoftDelete(ctx context.Context, messageID, senderID string) (string, error) {
	var conversationID string
	row := r.db.QueryRow(ctx, `
		UPDATE messages
		SET deleted_at = NOW(), content = '', updated_at = NOW()
		WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
		RETURNING conversation_id`, messageID, senderID)

	err := row.Scan(&conversationID)
	if err != nil {
		return "", fmt.Errorf("message not found or not owned by sender: %w", err)
	}
	return conversationID, nil
}

// UpsertStatus inserts or updates a delivery/read status for a message and user.
func (r *MessageRepo) UpsertStatus(ctx context.Context, messageID, userID, status string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO message_status (message_id, user_id, status, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (message_id, user_id) DO UPDATE SET status = $3, updated_at = NOW()`,
		messageID, userID, status)
	return err
}

// MarkConversationRead marks all messages in a conversation as read for a user up to a given message ID (or all messages if lastMessageID is empty).
func (r *MessageRepo) MarkConversationRead(ctx context.Context, conversationID, userID, lastMessageID string) error {
	if lastMessageID == "" {
		_, err := r.db.Exec(ctx, `
			INSERT INTO message_status (message_id, user_id, status, updated_at)
			SELECT m.id, $1, 'READ', NOW()
			FROM messages m
			WHERE m.conversation_id = $2
			  AND m.sender_id <> $1
			  AND m.deleted_at IS NULL
			ON CONFLICT (message_id, user_id) DO UPDATE SET status = 'READ', updated_at = NOW()`,
			userID, conversationID)
		return err
	}

	_, err := r.db.Exec(ctx, `
		INSERT INTO message_status (message_id, user_id, status, updated_at)
		SELECT m.id, $1, 'READ', NOW()
		FROM messages m
		WHERE m.conversation_id = $2
		  AND m.sender_id <> $1
		  AND m.deleted_at IS NULL
		  AND m.created_at <= (SELECT created_at FROM messages WHERE id = $3)
		ON CONFLICT (message_id, user_id) DO UPDATE SET status = 'READ', updated_at = NOW()`,
		userID, conversationID, lastMessageID)
	return err
}

// AddReaction inserts an emoji reaction (idempotent).
func (r *MessageRepo) AddReaction(ctx context.Context, messageID, userID, userName, emoji string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO message_reactions (message_id, user_id, user_name, emoji)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
		messageID, userID, userName, emoji)
	return err
}

// RemoveReaction deletes an emoji reaction.
func (r *MessageRepo) RemoveReaction(ctx context.Context, messageID, userID, emoji string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
		messageID, userID, emoji)
	return err
}

// GetReactions returns the aggregated reaction map (emoji → list of userIDs) and the conversation ID.
func (r *MessageRepo) GetReactions(ctx context.Context, messageID string) (map[string][]string, string, error) {
	// Get conversation ID
	var conversationID string
	r.db.QueryRow(ctx, `SELECT conversation_id FROM messages WHERE id = $1`, messageID).Scan(&conversationID)

	rows, err := r.db.Query(ctx, `
		SELECT emoji, user_id FROM message_reactions WHERE message_id = $1 ORDER BY created_at`, messageID)
	if err != nil {
		return nil, conversationID, err
	}
	defer rows.Close()

	reactions := make(map[string][]string)
	for rows.Next() {
		var emoji, userID string
		if err := rows.Scan(&emoji, &userID); err != nil {
			continue
		}
		reactions[emoji] = append(reactions[emoji], userID)
	}
	return reactions, conversationID, rows.Err()
}

// MessageToPayload converts a Message to models.MessagePayload for WS delivery.
func MessageToPayload(msg *Message, replyTo *Message) models.MessagePayload {
	p := models.MessagePayload{
		ID:             msg.ID,
		ConversationID: msg.ConversationID,
		SenderID:       msg.SenderID,
		SenderEmail:    msg.SenderEmail,
		SenderName:     msg.SenderName,
		SenderAvatar:   msg.SenderAvatar,
		Content:        msg.Content,
		Type:           msg.Type,
		IsEdited:       msg.IsEdited,
		Reactions:      msg.Reactions,
		CreatedAt:      msg.CreatedAt,
		UpdatedAt:      msg.UpdatedAt,
	}
	if msg.ReplyTo != nil {
		rt := MessageToPayload(msg.ReplyTo, nil)
		p.ReplyTo = &rt
	} else if replyTo != nil {
		rt := MessageToPayload(replyTo, nil)
		p.ReplyTo = &rt
	}
	return p
}

func reverseMessages(msgs []*Message) []*Message {
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs
}
