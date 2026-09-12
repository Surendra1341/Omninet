package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"

	"github.com/omninet/chat-service/internal/hub"
	"github.com/omninet/chat-service/internal/middleware"
	"github.com/omninet/chat-service/internal/repository"
)

// ConversationHandler handles REST API requests for conversations.
type ConversationHandler struct {
	convRepo *repository.ConversationRepo
	hub      *hub.Hub
	log      *zap.Logger
}

// NewConversationHandler creates a ConversationHandler.
func NewConversationHandler(convRepo *repository.ConversationRepo, h *hub.Hub, log *zap.Logger) *ConversationHandler {
	return &ConversationHandler{convRepo: convRepo, hub: h, log: log}
}

// createConversationRequest is the request body for creating a conversation.
type createConversationRequest struct {
	Type      string   `json:"type"`       // "DM" or "GROUP"
	Name      string   `json:"name"`       // Required for GROUP
	AvatarURL string   `json:"avatar_url"` // Optional
	Members   []memberInfo `json:"members"` // List of members (excluding self, who is always added)
}

type memberInfo struct {
	UserID     string `json:"user_id"`
	UserName   string `json:"user_name"`
	UserEmail  string `json:"user_email"`
	UserAvatar string `json:"user_avatar"`
}

// List returns all conversations for the authenticated user.
// GET /api/chat/conversations
func (h *ConversationHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	convs, err := h.convRepo.ListForUser(r.Context(), claims.UserID)
	if err != nil {
		h.log.Error("Failed to list conversations", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "Failed to load conversations")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"conversations": convs,
	})
}

// Create creates a new DM or group conversation.
// POST /api/chat/conversations
func (h *ConversationHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req createConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Type != "DM" && req.Type != "GROUP" {
		writeError(w, http.StatusBadRequest, "type must be DM or GROUP")
		return
	}
	if req.Type == "GROUP" && req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required for GROUP conversations")
		return
	}
	if len(req.Members) == 0 {
		writeError(w, http.StatusBadRequest, "at least one other member is required")
		return
	}

	// For DM — check if conversation already exists
	if req.Type == "DM" && len(req.Members) == 1 {
		existing, err := h.convRepo.FindDM(r.Context(), claims.UserID, req.Members[0].UserID)
		if err == nil && existing != nil {
			writeJSON(w, http.StatusOK, map[string]interface{}{"conversation": existing})
			return
		}
	}

	// Build members list including the creator
	members := []repository.ConversationMember{
		{
			UserID:     claims.UserID,
			UserName:   claims.Name,
			UserEmail:  claims.Email,
		},
	}
	for _, m := range req.Members {
		members = append(members, repository.ConversationMember{
			UserID:     m.UserID,
			UserName:   m.UserName,
			UserEmail:  m.UserEmail,
			UserAvatar: m.UserAvatar,
		})
	}

	conv, err := h.convRepo.Create(r.Context(), req.Type, req.Name, req.AvatarURL, claims.UserID, members)
	if err != nil {
		h.log.Error("Failed to create conversation", zap.Error(err))
		writeError(w, http.StatusInternalServerError, "Failed to create conversation")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"conversation": conv})
}

// GetByID returns details of a single conversation.
// GET /api/chat/conversations/{id}
func (h *ConversationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

	conv, err := h.convRepo.GetByID(r.Context(), convID)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeError(w, http.StatusNotFound, "Conversation not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to load conversation")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"conversation": conv})
}

// Update updates a group conversation's name or avatar.
// PUT /api/chat/conversations/{id}
func (h *ConversationHandler) Update(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.convRepo.Update(r.Context(), convID, req.Name, req.AvatarURL); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update conversation")
		return
	}

	conv, _ := h.convRepo.GetByID(r.Context(), convID)
	writeJSON(w, http.StatusOK, conv)
}

// AddMember adds a user to a group conversation.
// POST /api/chat/conversations/{id}/members
func (h *ConversationHandler) AddMember(w http.ResponseWriter, r *http.Request) {
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

	var req memberInfo
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	member := repository.ConversationMember{
		UserID:     req.UserID,
		UserName:   req.UserName,
		UserEmail:  req.UserEmail,
		UserAvatar: req.UserAvatar,
	}
	if err := h.convRepo.AddMember(r.Context(), convID, member); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to add member")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "member added"})
}

// RemoveMember removes a user from a group conversation.
// DELETE /api/chat/conversations/{id}/members/{userId}
func (h *ConversationHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	convID := chi.URLParam(r, "id")
	targetUserID := chi.URLParam(r, "userId")

	// Users can only remove themselves or... only themselves (no admin role in this design)
	if targetUserID != claims.UserID {
		writeError(w, http.StatusForbidden, "You can only remove yourself from a conversation")
		return
	}

	if err := h.convRepo.RemoveMember(r.Context(), convID, targetUserID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to remove member")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

// helpers
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
