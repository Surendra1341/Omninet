package hub

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/omninet/chat-service/internal/cache"
	"github.com/omninet/chat-service/internal/repository"
)

// Hub maintains the set of active WebSocket clients and broadcasts messages.
// For multi-instance scaling, it uses Redis pub/sub to fan out messages
// across instances — so a message sent to Instance A is also received
// by clients on Instance B.
type Hub struct {
	log      *zap.Logger
	cache    *cache.Client
	db       *pgxpool.Pool
	msgRepo  *repository.MessageRepo
	convRepo *repository.ConversationRepo
	presRepo *repository.PresenceRepo

	// WebSocket upgrader
	upgrader websocket.Upgrader

	// Registered clients: userID → set of clients (a user can have multiple tabs)
	clients map[string]map[*Client]bool
	mu      sync.RWMutex

	// Channels for hub operations
	register   chan *Client
	unregister chan *Client
}

// New creates and starts a Hub.
func New(
	log *zap.Logger,
	cacheClient *cache.Client,
	db *pgxpool.Pool,
	msgRepo *repository.MessageRepo,
	convRepo *repository.ConversationRepo,
	presRepo *repository.PresenceRepo,
) *Hub {
	h := &Hub{
		log:      log,
		cache:    cacheClient,
		db:       db,
		msgRepo:  msgRepo,
		convRepo: convRepo,
		presRepo: presRepo,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     func(r *http.Request) bool { return true }, // CORS handled by middleware
		},
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client, 64),
		unregister: make(chan *Client, 64),
	}
	return h
}

// Run starts the hub event loop and the Redis subscriber goroutine.
func (h *Hub) Run(ctx context.Context) {
	go h.subscribeRedis(ctx)

	for {
		select {
		case <-ctx.Done():
			return

		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true

			// Collect all other currently online users to send to this newly connected client
			var currentlyOnline []string
			for uid, conns := range h.clients {
				if len(conns) > 0 && uid != client.UserID {
					currentlyOnline = append(currentlyOnline, uid)
				}
			}
			h.mu.Unlock()

			// Mark user online in Redis and persist to DB
			h.cache.SetPresence(ctx, client.UserID, true)
			h.presRepo.Upsert(ctx, client.UserID, "ONLINE")

			// Broadcast online presence to all connected users
			h.broadcastPresence(ctx, client.UserID, "ONLINE")

			// Send currently online users to this new client immediately
			for _, uid := range currentlyOnline {
				client.Send(OutgoingEvent{
					Type: EventPresence,
					Payload: PresencePayload{
						UserID: uid,
						Status: "ONLINE",
					},
				})
			}

			h.log.Info("Client connected",
				zap.String("user_id", client.UserID),
				zap.String("email", client.Email))

		case client := <-h.unregister:
			h.mu.Lock()
			if conns := h.clients[client.UserID]; conns != nil {
				delete(conns, client)
				if len(conns) == 0 {
					delete(h.clients, client.UserID)
				}
			}
			isNowOffline := len(h.clients[client.UserID]) == 0
			h.mu.Unlock()

			close(client.send)

			if isNowOffline {
				h.cache.SetPresence(ctx, client.UserID, false)
				h.presRepo.Upsert(ctx, client.UserID, "OFFLINE")
				h.broadcastPresence(ctx, client.UserID, "OFFLINE")
				h.log.Info("Client disconnected (all sessions closed)",
					zap.String("user_id", client.UserID))
			}
		}
	}
}

// handleEvent processes an incoming WebSocket event from a client.
func (h *Hub) handleEvent(ctx context.Context, c *Client, event *IncomingEvent) {
	h.cache.RefreshPresence(ctx, c.UserID)

	switch event.Type {
	case EventPing:
		c.Send(OutgoingEvent{Type: EventPong})

	case EventSendMessage:
		h.handleSendMessage(ctx, c, event)

	case EventTyping:
		h.handleTyping(ctx, c, event)

	case EventMarkRead:
		h.handleMarkRead(ctx, c, event)

	case EventAddReaction:
		h.handleReaction(ctx, c, event, true)

	case EventRemoveReaction:
		h.handleReaction(ctx, c, event, false)

	default:
		c.sendError("UNKNOWN_EVENT", fmt.Sprintf("Unknown event type: %s", event.Type))
	}
}

func (h *Hub) handleSendMessage(ctx context.Context, c *Client, event *IncomingEvent) {
	if event.ConversationID == "" {
		c.sendError("MISSING_FIELD", "conversation_id is required")
		return
	}
	if event.Content == "" {
		c.sendError("MISSING_FIELD", "content is required")
		return
	}

	// Verify the sender is a member of the conversation
	isMember, err := h.convRepo.IsMember(ctx, event.ConversationID, c.UserID)
	if err != nil || !isMember {
		c.sendError("FORBIDDEN", "Not a member of this conversation")
		return
	}

	// Persist the message
	msg, err := h.msgRepo.Create(ctx, repository.CreateMessageInput{
		ConversationID: event.ConversationID,
		SenderID:       c.UserID,
		SenderEmail:    c.Email,
		SenderName:     c.Name,
		Content:        event.Content,
		Type:           "TEXT",
		ReplyToID:      event.ReplyToID,
	})
	if err != nil {
		h.log.Error("Failed to persist message", zap.Error(err))
		c.sendError("SERVER_ERROR", "Failed to send message")
		return
	}

	// Update conversation updated_at
	h.convRepo.UpdateTimestamp(ctx, event.ConversationID)

	// Build the outgoing event
	payload := repository.MessageToPayload(msg, nil)
	outEvent := OutgoingEvent{Type: EventNewMessage, Payload: payload}

	// Deliver to all members of the conversation
	members, err := h.convRepo.GetMemberIDs(ctx, event.ConversationID)
	if err != nil {
		h.log.Error("Failed to get members for broadcast", zap.Error(err))
		return
	}

	for _, memberID := range members {
		h.deliverToUser(ctx, memberID, event.ConversationID, outEvent)
		// Mark as delivered for everyone except sender (handled client-side as sent)
		if memberID != c.UserID {
			h.msgRepo.UpsertStatus(ctx, msg.ID, memberID, "DELIVERED")
		}
	}
}

func (h *Hub) handleTyping(ctx context.Context, c *Client, event *IncomingEvent) {
	if event.ConversationID == "" {
		return
	}
	h.cache.SetTyping(ctx, event.ConversationID, c.UserID)

	payload := TypingPayload{
		ConversationID: event.ConversationID,
		UserID:         c.UserID,
		UserName:       c.Name,
	}
	outEvent := OutgoingEvent{Type: EventTypingEvent, Payload: payload}

	members, err := h.convRepo.GetMemberIDs(ctx, event.ConversationID)
	if err != nil {
		return
	}

	for _, memberID := range members {
		if memberID != c.UserID {
			h.deliverToUser(ctx, memberID, event.ConversationID, outEvent)
		}
	}
}

func (h *Hub) handleMarkRead(ctx context.Context, c *Client, event *IncomingEvent) {
	if event.ConversationID == "" || event.LastMessageID == "" {
		return
	}

	// Mark all messages in the conversation as read up to lastMessageID
	if err := h.msgRepo.MarkConversationRead(ctx, event.ConversationID, c.UserID, event.LastMessageID); err != nil {
		h.log.Error("Failed to mark messages as read", zap.Error(err))
		return
	}

	// Update member's last_read_at
	h.convRepo.UpdateLastRead(ctx, event.ConversationID, c.UserID)

	// Notify the senders that their messages were read
	statusPayload := MessageStatusPayload{
		ConversationID: event.ConversationID,
		UserID:         c.UserID,
		MessageID:      event.LastMessageID,
		Status:         "READ",
		UpdatedAt:      time.Now(),
	}
	statusEvent := OutgoingEvent{Type: EventMessageStatus, Payload: statusPayload}

	members, _ := h.convRepo.GetMemberIDs(ctx, event.ConversationID)
	for _, memberID := range members {
		if memberID != c.UserID {
			h.deliverToUser(ctx, memberID, event.ConversationID, statusEvent)
		}
	}
}

func (h *Hub) handleReaction(ctx context.Context, c *Client, event *IncomingEvent, add bool) {
	if event.MessageID == "" || event.Emoji == "" {
		c.sendError("MISSING_FIELD", "message_id and emoji are required")
		return
	}

	var err error
	if add {
		err = h.msgRepo.AddReaction(ctx, event.MessageID, c.UserID, c.Name, event.Emoji)
	} else {
		err = h.msgRepo.RemoveReaction(ctx, event.MessageID, c.UserID, event.Emoji)
	}
	if err != nil {
		c.sendError("SERVER_ERROR", "Failed to update reaction")
		return
	}

	// Get updated reactions for the message
	reactions, conversationID, err := h.msgRepo.GetReactions(ctx, event.MessageID)
	if err != nil {
		return
	}

	outEvent := OutgoingEvent{
		Type: EventReactionUpdate,
		Payload: ReactionUpdatePayload{
			MessageID:      event.MessageID,
			ConversationID: conversationID,
			Reactions:      reactions,
		},
	}

	members, _ := h.convRepo.GetMemberIDs(ctx, conversationID)
	for _, memberID := range members {
		h.deliverToUser(ctx, memberID, conversationID, outEvent)
	}
}

// IsUserOnline returns true if the user has any active WebSocket connections on this hub.
func (h *Hub) IsUserOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[userID]) > 0
}

// broadcastPresence notifies all connected clients of a user's presence change.
func (h *Hub) broadcastPresence(ctx context.Context, userID, status string) {
	outEvent := OutgoingEvent{
		Type:    EventPresence,
		Payload: PresencePayload{UserID: userID, Status: status},
	}

	// Deliver to all locally connected clients immediately
	h.mu.RLock()
	for _, conns := range h.clients {
		for client := range conns {
			client.Send(outEvent)
		}
	}
	h.mu.RUnlock()

	envelope := RedisMessage{
		Event: outEvent,
	}
	data, _ := json.Marshal(envelope)
	h.cache.Publish(ctx, "chat:presence", data)
}

// deliverToUser sends an event to a user's local clients, or publishes to Redis
// for delivery by another instance.
func (h *Hub) deliverToUser(ctx context.Context, userID, conversationID string, event OutgoingEvent) {
	// Try local delivery first
	h.mu.RLock()
	conns := h.clients[userID]
	h.mu.RUnlock()

	if len(conns) > 0 {
		for client := range conns {
			client.Send(event)
		}
		return
	}

	// Not connected locally — publish to Redis for other instances
	envelope := RedisMessage{
		TargetUserID:   userID,
		ConversationID: conversationID,
		Event:          event,
	}
	data, err := json.Marshal(envelope)
	if err != nil {
		return
	}
	channel := fmt.Sprintf("chat:conv:%s", conversationID)
	h.cache.Publish(ctx, channel, data)
}

// subscribeRedis listens to the Redis pub/sub channels and delivers messages
// to locally connected clients (for multi-instance horizontal scaling).
func (h *Hub) subscribeRedis(ctx context.Context) {
	pubsub := h.cache.Subscribe(ctx, "chat:presence")

	go func() {
		<-ctx.Done()
		pubsub.Close()
	}()

	for msg := range pubsub.Channel() {
		var envelope RedisMessage
		if err := json.Unmarshal([]byte(msg.Payload), &envelope); err != nil {
			continue
		}

		if envelope.TargetUserID != "" {
			// Direct delivery to a specific user
			h.mu.RLock()
			conns := h.clients[envelope.TargetUserID]
			h.mu.RUnlock()
			for client := range conns {
				client.Send(envelope.Event)
			}
		} else {
			// Broadcast (e.g., presence) to all local clients
			h.mu.RLock()
			for _, conns := range h.clients {
				for client := range conns {
					client.Send(envelope.Event)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToConversation subscribes this instance to a conversation's Redis channel.
// Call this when a conversation is created or a member joins.
func (h *Hub) SubscribeConversation(ctx context.Context, conversationID string) {
	channel := fmt.Sprintf("chat:conv:%s", conversationID)
	pubsub := h.cache.Subscribe(ctx, channel)

	go func() {
		defer pubsub.Close()
		for msg := range pubsub.Channel() {
			var envelope RedisMessage
			if err := json.Unmarshal([]byte(msg.Payload), &envelope); err != nil {
				continue
			}

			if envelope.TargetUserID != "" {
				h.mu.RLock()
				conns := h.clients[envelope.TargetUserID]
				h.mu.RUnlock()
				for client := range conns {
					client.Send(envelope.Event)
				}
			}
		}
	}()
}

// SendToConversation sends a message to all members of a conversation (from REST handlers).
func (h *Hub) SendToConversation(ctx context.Context, memberIDs []string, conversationID string, event OutgoingEvent) {
	for _, memberID := range memberIDs {
		h.deliverToUser(ctx, memberID, conversationID, event)
	}
}
