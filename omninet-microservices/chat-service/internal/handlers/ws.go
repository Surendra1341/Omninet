package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/omninet/chat-service/internal/auth"
	"github.com/omninet/chat-service/internal/hub"
	"go.uber.org/zap"
)

// WSHandler handles WebSocket upgrade requests.
type WSHandler struct {
	hub       *hub.Hub
	validator *auth.Validator
	log       *zap.Logger
}

// NewWSHandler creates a WSHandler.
func NewWSHandler(h *hub.Hub, validator *auth.Validator, log *zap.Logger) *WSHandler {
	return &WSHandler{hub: h, validator: validator, log: log}
}

// ServeHTTP upgrades the HTTP connection to WebSocket.
// The JWT token is extracted from the Authorization header or ?token= query param.
func (h *WSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	claims, err := h.validator.ExtractFromRequest(r)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized", "message": err.Error()})
		return
	}

	h.log.Info("WebSocket upgrade", zap.String("user", claims.Email))
	hub.ServeWS(h.hub, w, r, claims.UserID, claims.Email, claims.Name)
}
