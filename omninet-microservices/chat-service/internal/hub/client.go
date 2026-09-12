package hub

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 8192 // 8 KB
)

// Client represents a single connected WebSocket client.
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	mu     sync.Mutex

	// Identity
	UserID string
	Email  string
	Name   string
}

// readPump reads messages from the WebSocket and dispatches them to the hub.
// It runs in its own goroutine per connection.
func (c *Client) readPump(ctx context.Context) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		c.hub.cache.RefreshPresence(ctx, c.UserID)
		return nil
	})

	for {
		_, rawMsg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.hub.log.Warn("WebSocket read error", zap.String("user", c.UserID), zap.Error(err))
			}
			return
		}

		var event IncomingEvent
		if err := json.Unmarshal(rawMsg, &event); err != nil {
			c.sendError("INVALID_JSON", "Could not parse message")
			continue
		}

		c.hub.handleEvent(ctx, c, &event)
	}
}

// writePump pumps messages from the send channel to the WebSocket connection.
// It runs in its own goroutine per connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Send enqueues a JSON event for delivery to this client (non-blocking).
func (c *Client) Send(event OutgoingEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		return
	}
	select {
	case c.send <- data:
	default:
		// Client send buffer full — drop message to avoid blocking hub
		c.hub.log.Warn("Client send buffer full, dropping message", zap.String("user", c.UserID))
	}
}

// sendError sends an error event to this client.
func (c *Client) sendError(code, message string) {
	c.Send(OutgoingEvent{
		Type:    EventError,
		Payload: ErrorPayload{Code: code, Message: message},
	})
}

// ServeWS upgrades an HTTP request to a WebSocket connection and starts the client pumps.
func ServeWS(h *Hub, w http.ResponseWriter, r *http.Request, userID, email, name string) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.log.Error("WebSocket upgrade failed", zap.Error(err))
		return
	}

	client := &Client{
		hub:    h,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
		Email:  email,
		Name:   name,
	}

	h.register <- client

	// Send connected acknowledgment immediately
	client.Send(OutgoingEvent{
		Type:    EventConnected,
		Payload: ConnectedPayload{UserID: userID, Email: email},
	})

	go client.writePump()
	go client.readPump(context.Background())
}
