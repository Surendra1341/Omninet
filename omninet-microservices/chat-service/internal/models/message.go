package models

import "time"

// MessagePayload is the full message object sent over WebSocket and REST API.
// Defined in a shared models package to avoid import cycles between hub and repository.
type MessagePayload struct {
	ID             string              `json:"id"`
	ConversationID string              `json:"conversation_id"`
	SenderID       string              `json:"sender_id"`
	SenderEmail    string              `json:"sender_email"`
	SenderName     string              `json:"sender_name"`
	SenderAvatar   string              `json:"sender_avatar,omitempty"`
	Content        string              `json:"content"`
	Type           string              `json:"type"`
	ReplyTo        *MessagePayload     `json:"reply_to,omitempty"`
	IsEdited       bool                `json:"is_edited"`
	Reactions      map[string][]string `json:"reactions,omitempty"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}
