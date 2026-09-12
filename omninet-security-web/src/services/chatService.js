import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

const CHAT_BASE_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:8085';
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'ws://localhost:8085/ws';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Axios instance for Chat REST API
export const chatAxios = axios.create({
  baseURL: CHAT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token dynamically to every request
chatAxios.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Chat REST API client
export const chatApi = {
  // Conversations
  getConversations: async () => {
    const response = await chatAxios.get('/api/chat/conversations');
    return response.data?.conversations || [];
  },

  createConversation: async (data) => {
    // data: { type: 'DM' | 'GROUP', name?: string, avatar_url?: string, members: [{ user_id, user_name, user_email, user_avatar }] }
    const response = await chatAxios.post('/api/chat/conversations', data);
    return response.data?.conversation || response.data;
  },

  getConversation: async (id) => {
    const response = await chatAxios.get(`/api/chat/conversations/${id}`);
    return response.data?.conversation || response.data;
  },

  updateConversation: async (id, data) => {
    const response = await chatAxios.put(`/api/chat/conversations/${id}`, data);
    return response.data;
  },

  addMember: async (conversationId, member) => {
    const response = await chatAxios.post(`/api/chat/conversations/${conversationId}/members`, member);
    return response.data;
  },

  removeMember: async (conversationId, userId) => {
    const response = await chatAxios.delete(`/api/chat/conversations/${conversationId}/members/${userId}`);
    return response.data;
  },

  // Messages
  getMessages: async (conversationId, cursor = '', limit = 30) => {
    let url = `/api/chat/conversations/${conversationId}/messages?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    const response = await chatAxios.get(url);
    return response.data; // { messages: [...], next_cursor: string }
  },

  sendMessage: async (conversationId, content, replyToId = null) => {
    const response = await chatAxios.post(`/api/chat/conversations/${conversationId}/messages`, {
      content,
      reply_to_id: replyToId,
    });
    return response.data?.message;
  },

  editMessage: async (messageId, content) => {
    const response = await chatAxios.put(`/api/chat/messages/${messageId}`, { content });
    return response.data?.message;
  },

  deleteMessage: async (messageId) => {
    const response = await chatAxios.delete(`/api/chat/messages/${messageId}`);
    return response.data;
  },

  addReaction: async (messageId, emoji) => {
    const response = await chatAxios.post(`/api/chat/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  removeReaction: async (messageId, emoji) => {
    const response = await chatAxios.delete(`/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    return response.data;
  },

  markAsRead: async (conversationId, lastMessageId = '') => {
    const response = await chatAxios.post(`/api/chat/conversations/${conversationId}/read`, {
      last_message_id: lastMessageId,
    });
    return response.data;
  },

  // Presence
  getPresence: async (userIds = []) => {
    if (!userIds || userIds.length === 0) return {};
    const response = await chatAxios.get(`/api/chat/presence?user_ids=${userIds.join(',')}`);
    return response.data?.presence || {};
  },

  // User search (queries auth-service through API Gateway)
  searchUsers: async (query) => {
    if (!query || query.trim().length === 0) return [];
    const token = tokenManager.getAccessToken();
    const response = await axios.get(`${API_BASE_URL}/api/v1/users/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return response.data?.data || [];
  },
};

// WebSocket Client for Real-time events
class ChatWebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.isConnected = false;
    this.isExplicitlyClosed = false;
  }

  connect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = tokenManager.getAccessToken();
    if (!token) {
      console.warn('[ChatWS] No access token available for WebSocket connection');
      return;
    }

    this.isExplicitlyClosed = false;
    const wsUrl = `${CHAT_WS_URL}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[ChatWS] Connected to chat service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection_change', { status: 'connected' });
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data);
        } catch (err) {
          console.error('[ChatWS] Failed to parse message:', err, event.data);
        }
      };

      this.ws.onerror = (err) => {
        if (!this.isExplicitlyClosed) {
          console.error('[ChatWS] WebSocket error:', err);
          this.emit('connection_change', { status: 'error', error: err });
        }
      };

      this.ws.onclose = (event) => {
        if (this.isExplicitlyClosed) return;

        console.log('[ChatWS] Disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('connection_change', { status: 'disconnected' });

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
          this.reconnectAttempts++;
          console.log(`[ChatWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
          this.reconnectTimer = setTimeout(() => {
            if (!this.isExplicitlyClosed) {
              this.connect();
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error('[ChatWS] Connection error:', err);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 15000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      socket.onmessage = null;
      socket.onerror = null;

      if (socket.readyState === WebSocket.CONNECTING) {
        // If still connecting, wait until opened before closing to prevent browser warning
        socket.onopen = () => {
          try {
            socket.close();
          } catch (e) {}
        };
        socket.onclose = null;
      } else {
        socket.onopen = null;
        socket.onclose = null;
        try {
          socket.close();
        } catch (e) {}
      }
    }
    this.isConnected = false;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // High-level send actions
  sendMessage(conversationId, content, replyToId = null) {
    return this.send({
      type: 'send_message',
      conversation_id: conversationId,
      content,
      reply_to_id: replyToId,
    });
  }

  sendTyping(conversationId) {
    return this.send({
      type: 'typing',
      conversation_id: conversationId,
    });
  }

  sendMarkRead(conversationId, lastMessageId = '') {
    return this.send({
      type: 'mark_read',
      conversation_id: conversationId,
      last_message_id: lastMessageId,
    });
  }

  sendAddReaction(messageId, emoji) {
    return this.send({
      type: 'add_reaction',
      message_id: messageId,
      emoji,
    });
  }

  sendRemoveReaction(messageId, emoji) {
    return this.send({
      type: 'remove_reaction',
      message_id: messageId,
      emoji,
    });
  }

  handleIncomingEvent(event) {
    const { type, payload } = event;
    if (type === 'pong') return;

    // Dispatch to specific type listeners
    this.emit(type, payload);
    // Dispatch to global event listeners
    this.emit('*', event);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (err) {
          console.error(`[ChatWS] Error in event listener for '${event}':`, err);
        }
      }
    }
  }
}

export const chatWs = new ChatWebSocketClient();
