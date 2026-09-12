package hub

import (
	"time"

	"github.com/omninet/chat-service/internal/models"
)

// EventType defines all WebSocket event types exchanged between client and server.
type EventType string

const (
	// Client → Server
	EventSendMessage    EventType = "send_message"
	EventTyping         EventType = "typing"
	EventMarkRead       EventType = "mark_read"
	EventAddReaction    EventType = "add_reaction"
	EventRemoveReaction EventType = "remove_reaction"
	EventPing           EventType = "ping"

	// Server → Client
	EventNewMessage     EventType = "new_message"
	EventMessageEdited  EventType = "message_edited"
	EventMessageDeleted EventType = "message_deleted"
	EventMessageStatus  EventType = "message_status"
	EventTypingEvent    EventType = "typing"
	EventPresence       EventType = "presence"
	EventReactionUpdate EventType = "reaction_update"
	EventPong           EventType = "pong"
	EventError          EventType = "error"
	EventConnected      EventType = "connected"
)

// IncomingEvent is a message received FROM the client over WebSocket.
type IncomingEvent struct {
	Type           EventType `json:"type"`
	ConversationID string    `json:"conversation_id,omitempty"`
	MessageID      string    `json:"message_id,omitempty"`
	Content        string    `json:"content,omitempty"`
	ReplyToID      string    `json:"reply_to_id,omitempty"`
	Emoji          string    `json:"emoji,omitempty"`
	LastMessageID  string    `json:"last_message_id,omitempty"`
}

// OutgoingEvent is a message sent TO the client over WebSocket.
type OutgoingEvent struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

// Use models.MessagePayload as the canonical MessagePayload type.
type MessagePayload = models.MessagePayload

// MessageEditedPayload is sent when a message is edited.
type MessageEditedPayload struct {
	MessageID      string    `json:"message_id"`
	ConversationID string    `json:"conversation_id"`
	Content        string    `json:"content"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// MessageDeletedPayload is sent when a message is unsent.
type MessageDeletedPayload struct {
	MessageID      string `json:"message_id"`
	ConversationID string `json:"conversation_id"`
}

// MessageStatusPayload is sent for delivery/read receipts.
type MessageStatusPayload struct {
	MessageID      string    `json:"message_id"`
	ConversationID string    `json:"conversation_id"`
	UserID         string    `json:"user_id"`
	Status         string    `json:"status"` // "DELIVERED" | "READ"
	UpdatedAt      time.Time `json:"updated_at"`
}

// TypingPayload is sent when a user is typing.
type TypingPayload struct {
	ConversationID string `json:"conversation_id"`
	UserID         string `json:"user_id"`
	UserName       string `json:"user_name"`
}

// PresencePayload is sent when a user comes online or goes offline.
type PresencePayload struct {
	UserID   string `json:"user_id"`
	Status   string `json:"status"` // "ONLINE" | "OFFLINE"
	LastSeen string `json:"last_seen,omitempty"`
}

// ReactionUpdatePayload is sent when reactions on a message change.
type ReactionUpdatePayload struct {
	MessageID      string              `json:"message_id"`
	ConversationID string              `json:"conversation_id"`
	Reactions      map[string][]string `json:"reactions"` // emoji → list of user IDs
}

// ErrorPayload is sent when an operation fails.
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ConnectedPayload is sent immediately after WS connection is established.
type ConnectedPayload struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
}

// RedisMessage is the envelope used when broadcasting via Redis pub/sub
// (for multi-instance horizontal scaling).
type RedisMessage struct {
	TargetUserID   string      `json:"target_user_id"`
	ConversationID string      `json:"conversation_id"`
	Event          OutgoingEvent `json:"event"`
}
