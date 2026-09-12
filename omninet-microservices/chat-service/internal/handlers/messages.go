package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/omninet/chat-service/internal/hub"
	"github.com/omninet/chat-service/internal/middleware"
	"github.com/omninet/chat-service/internal/repository"
)

// MessageHandler handles REST API requests for messages.
type MessageHandler struct {
	msgRepo  *repository.MessageRepo
	convRepo *repository.ConversationRepo
	hub      *hub.Hub
	log      *zap.Logger
}

// NewMessageHandler creates a MessageHandler.
func NewMessageHandler(msgRepo *repository.MessageRepo, convRepo *repository.ConversationRepo, h *hub.Hub, log *zap.Logger) *MessageHandler {
	return &MessageHandler{msgRepo: msgRepo, convRepo: convRepo, hub: h, log: log}
}

// List returns paginated messages for a conversation.
// GET /api/chat/conversations/{id}/messages?cursor=<msgID>&limit=30
func (h *MessageHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	convID := chi.URLParam(r, "id")
	isMember, err := h.convRepo.IsMember(r.Context(), convID, claims.UserID)
	if err != nil || !isMember {
		writeError(w, http.StatusForbidden, "Not a member of this conversation")
		return
	}

	cursor := r.URL.Query().Get("cursor")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = 30
	}

	msgs, err := h.msgRepo.ListForConversation(r.Context(), convID, cursor, limit)
	if err != nil {
		h.log.Error("Failed to list messages", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "Failed to load messages")
		return
	}

	// Get next cursor for pagination
	var nextCursor string
	if len(msgs) == limit {
		nextCursor = msgs[0].ID // oldest message in the batch
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"messages":    msgs,
		"next_cursor": nextCursor,
		"has_more":    nextCursor != "",
	})
}

// Edit edits the content of a message (sender only).
// PUT /api/chat/messages/{id}
func (h *MessageHandler) Edit(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	messageID := chi.URLParam(r, "id")

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
		writeError(w, http.StatusBadRequest, "content is required")
		return
	}

	msg, err := h.msgRepo.Update(r.Context(), messageID, claims.UserID, req.Content)
	if err != nil {
		writeError(w, http.StatusForbidden, "Message not found or you are not the sender")
		return
	}

	// Broadcast edit event to all members
	editPayload := hub.MessageEditedPayload{
		MessageID:      msg.ID,
		ConversationID: msg.ConversationID,
		Content:        msg.Content,
		UpdatedAt:      msg.UpdatedAt,
	}
	outEvent := hub.OutgoingEvent{Type: hub.EventMessageEdited, Payload: editPayload}
	memberIDs, _ := h.convRepo.GetMemberIDs(r.Context(), msg.ConversationID)
	h.hub.SendToConversation(r.Context(), memberIDs, msg.ConversationID, outEvent)

	writeJSON(w, http.StatusOK, msg)
}

// Delete unsends a message for everyone (sender only).
// DELETE /api/chat/messages/{id}
func (h *MessageHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	messageID := chi.URLParam(r, "id")
	conversationID, err := h.msgRepo.SoftDelete(r.Context(), messageID, claims.UserID)
	if err != nil {
		writeError(w, http.StatusForbidden, "Message not found or you are not the sender")
		return
	}

	// Broadcast delete event to all members
	outEvent := hub.OutgoingEvent{
		Type:    hub.EventMessageDeleted,
		Payload: hub.MessageDeletedPayload{MessageID: messageID, ConversationID: conversationID},
	}
	memberIDs, _ := h.convRepo.GetMemberIDs(r.Context(), conversationID)
	h.hub.SendToConversation(r.Context(), memberIDs, conversationID, outEvent)

	w.WriteHeader(http.StatusNoContent)
}

// AddReaction adds an emoji reaction to a message.
// POST /api/chat/messages/{id}/reactions
func (h *MessageHandler) AddReaction(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	messageID := chi.URLParam(r, "id")

	var req struct {
		Emoji string `json:"emoji"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Emoji == "" {
		writeError(w, http.StatusBadRequest, "emoji is required")
		return
	}

	if err := h.msgRepo.AddReaction(r.Context(), messageID, claims.UserID, claims.Name, req.Emoji); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to add reaction")
		return
	}

	h.broadcastReactionUpdate(r, messageID)
	w.WriteHeader(http.StatusNoContent)
}

// RemoveReaction removes an emoji reaction from a message.
// DELETE /api/chat/messages/{id}/reactions/{emoji}
func (h *MessageHandler) RemoveReaction(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	messageID := chi.URLParam(r, "id")
	emoji := chi.URLParam(r, "emoji")

	if err := h.msgRepo.RemoveReaction(r.Context(), messageID, claims.UserID, emoji); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to remove reaction")
		return
	}

	h.broadcastReactionUpdate(r, messageID)
	w.WriteHeader(http.StatusNoContent)
}

// MarkRead marks messages in a conversation as read.
// POST /api/chat/conversations/{id}/read
func (h *MessageHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	convID := chi.URLParam(r, "id")

	var req struct {
		LastMessageID string `json:"last_message_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	_ = h.msgRepo.MarkConversationRead(r.Context(), convID, claims.UserID, req.LastMessageID)
	h.convRepo.UpdateLastRead(r.Context(), convID, claims.UserID)

	w.WriteHeader(http.StatusNoContent)
}

func (h *MessageHandler) broadcastReactionUpdate(r *http.Request, messageID string) {
	reactions, conversationID, err := h.msgRepo.GetReactions(r.Context(), messageID)
	if err != nil {
		return
	}

	outEvent := hub.OutgoingEvent{
		Type: hub.EventReactionUpdate,
		Payload: hub.ReactionUpdatePayload{
			MessageID:      messageID,
			ConversationID: conversationID,
			Reactions:      reactions,
		},
	}
	memberIDs, _ := h.convRepo.GetMemberIDs(r.Context(), conversationID)
	h.hub.SendToConversation(r.Context(), memberIDs, conversationID, outEvent)
}
