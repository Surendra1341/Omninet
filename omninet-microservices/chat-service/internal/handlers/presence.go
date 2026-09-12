package handlers

import (
	"net/http"
	"strings"

	"go.uber.org/zap"

	"github.com/omninet/chat-service/internal/cache"
	"github.com/omninet/chat-service/internal/hub"
	"github.com/omninet/chat-service/internal/middleware"
	"github.com/omninet/chat-service/internal/repository"
)

// PresenceHandler handles REST API requests for user presence.
type PresenceHandler struct {
	presRepo *repository.PresenceRepo
	cache    *cache.Client
	hub      *hub.Hub
	log      *zap.Logger
}

// NewPresenceHandler creates a PresenceHandler.
func NewPresenceHandler(presRepo *repository.PresenceRepo, cacheClient *cache.Client, h *hub.Hub, log *zap.Logger) *PresenceHandler {
	return &PresenceHandler{presRepo: presRepo, cache: cacheClient, hub: h, log: log}
}

// GetMultiple returns presence data for a list of user IDs.
// GET /api/chat/presence?user_ids=id1,id2,id3
func (h *PresenceHandler) GetMultiple(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	rawIDs := r.URL.Query().Get("user_ids")
	if rawIDs == "" {
		writeJSON(w, http.StatusOK, map[string]interface{}{"presence": map[string]interface{}{}})
		return
	}

	userIDs := strings.Split(rawIDs, ",")
	results := make(map[string]interface{})

	for _, id := range userIDs {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		isOnline := h.hub.IsUserOnline(id) || h.cache.GetPresence(r.Context(), id)
		results[id] = map[string]interface{}{
			"user_id": id,
			"online":  isOnline,
			"status":  statusStr(isOnline),
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"presence": results})
}

func statusStr(online bool) string {
	if online {
		return "ONLINE"
	}
	return "OFFLINE"
}
