import { create } from 'zustand';
import { chatAPI } from '../services/api';
import { tokenManager } from '../utils/tokenManager';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '../services/api';

export const useChatStore = create((set, get) => ({
  // Connection state
  stompClient: null,
  connected: false,
  connecting: false,
  error: null,

  // User state
  currentUserEmail: null,

  // Contacts
  contacts: [],
  contactsLoading: false,
  selectedContact: null,

  // Messages
  messages: {},
  messagesLoading: false,
  currentPage: {},

  // UI state
  typingUsers: {},
  onlineUsers: new Set(),

  // WebSocket Management
  connect: async () => {
    const state = get();
    if (state.connected || state.connecting) return;

    try {
      set({ connecting: true, error: null });

      // Get auth token
      const token = tokenManager.getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const socket = new SockJS(`${API_BASE_URL}/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        debug: () => {}, // Disable debug logging
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },
        onConnect: (frame) => {
          console.log('Connected to WebSocket:', frame);
          
          // Get user email for subscriptions
          const userEmail = get().getCurrentUserEmail();
          if (userEmail) {
            console.log('Setting up subscriptions for user:', userEmail);

            // Text chat subscriptions
            try {
              // Subscribe to incoming messages
              client.subscribe(`/queue/messages-${userEmail}`, (message) => {
                try {
                  const messageData = JSON.parse(message.body);
                  console.debug('[CHAT] Incoming message:', messageData);
                  get().handleIncomingMessage(messageData);
                } catch (e) {
                  console.warn('[CHAT] Failed to parse message:', e);
                }
              });

              // Also subscribe to user destination for messages
              client.subscribe('/user/queue/messages', (message) => {
                try {
                  const messageData = JSON.parse(message.body);
                  console.debug('[CHAT] Incoming message (user):', messageData);
                  get().handleIncomingMessage(messageData);
                } catch (e) {
                  console.warn('[CHAT] Failed to parse message (user):', e);
                }
              });

              // Subscribe to read receipts
              client.subscribe(`/queue/read-${userEmail}`, (message) => {
                try {
                  const readData = JSON.parse(message.body);
                  console.debug('[CHAT] Read receipt:', readData);
                  get().handleReadReceipt(readData);
                } catch (e) {
                  console.warn('[CHAT] Failed to parse read receipt:', e);
                }
              });

              client.subscribe('/user/queue/read', (message) => {
                try {
                  const readData = JSON.parse(message.body);
                  console.debug('[CHAT] Read receipt (user):', readData);
                  get().handleReadReceipt(readData);
                } catch (e) {
                  console.warn('[CHAT] Failed to parse read receipt (user):', e);
                }
              });

              // Subscribe to typing indicators
              client.subscribe(`/queue/typing-${userEmail}`, (message) => {
                try {
                  const typingData = JSON.parse(message.body);
                  console.debug('[CHAT] Typing indicator:', typingData);
                  get().handleTypingIndicator(typingData);
                } catch (e) {
                  console.warn('[CHAT] Failed to parse typing indicator:', e);
                }
              });

              client.subscribe('/user/queue/typing', (message) => {
                try {
                  const typingData = JSON.parse(message.body);
                  console.debug('[CHAT] Typing indicator (user):', typingData);
                  get().handleTypingIndicator(typingData);
                } catch (e) {
                  console.warn('[CHAT] Failed to parse typing indicator (user):', e);
                }
              });

              // Call-related subscriptions
              // Call offers
              client.subscribe(`/queue/call-offer-${userEmail}`, (message) => {
                try {
                  const offerData = JSON.parse(message.body);
                  console.debug('[CHAT] Call offer:', offerData);
                  get().handleCallMessage({ ...offerData, type: 'CALL_OFFER' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call offer:', e);
                }
              });

              client.subscribe('/user/queue/call-offer', (message) => {
                try {
                  const offerData = JSON.parse(message.body);
                  console.debug('[CHAT] Call offer (user):', offerData);
                  get().handleCallMessage({ ...offerData, type: 'CALL_OFFER' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call offer (user):', e);
                }
              });

              // Call responses
              client.subscribe(`/queue/call-response-${userEmail}`, (message) => {
                try {
                  const responseData = JSON.parse(message.body);
                  console.debug('[CHAT] Call response:', responseData);
                  get().handleCallMessage({ ...responseData, type: 'CALL_RESPONSE' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call response:', e);
                }
              });

              client.subscribe('/user/queue/call-response', (message) => {
                try {
                  const responseData = JSON.parse(message.body);
                  console.debug('[CHAT] Call response (user):', responseData);
                  get().handleCallMessage({ ...responseData, type: 'CALL_RESPONSE' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call response (user):', e);
                }
              });

              // ICE candidates
              client.subscribe(`/queue/ice-candidate-${userEmail}`, (message) => {
                try {
                  const candidateData = JSON.parse(message.body);
                  console.debug('[CHAT] ICE candidate:', candidateData);
                  get().handleCallMessage({ ...candidateData, type: 'ICE_CANDIDATE' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse ICE candidate:', e);
                }
              });

              client.subscribe('/user/queue/ice-candidate', (message) => {
                try {
                  const candidateData = JSON.parse(message.body);
                  console.debug('[CHAT] ICE candidate (user):', candidateData);
                  get().handleCallMessage({ ...candidateData, type: 'ICE_CANDIDATE' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse ICE candidate (user):', e);
                }
              });

              // Call status updates
              client.subscribe(`/queue/call-status-${userEmail}`, (message) => {
                try {
                  const statusData = JSON.parse(message.body);
                  console.debug('[CHAT] Call status:', statusData);
                  get().handleCallMessage({ ...statusData, type: 'CALL_STATUS' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call status:', e);
                }
              });

              client.subscribe('/user/queue/call-status', (message) => {
                try {
                  const statusData = JSON.parse(message.body);
                  console.debug('[CHAT] Call status (user):', statusData);
                  get().handleCallMessage({ ...statusData, type: 'CALL_STATUS' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call status (user):', e);
                }
              });

              // Call end notifications
              client.subscribe(`/queue/call-end-${userEmail}`, (message) => {
                try {
                  const endData = JSON.parse(message.body);
                  console.debug('[CHAT] Call end:', endData);
                  get().handleCallMessage({ ...endData, type: 'CALL_END' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call end:', e);
                }
              });

              client.subscribe('/user/queue/call-end', (message) => {
                try {
                  const endData = JSON.parse(message.body);
                  console.debug('[CHAT] Call end (user):', endData);
                  get().handleCallMessage({ ...endData, type: 'CALL_END' });
                } catch (e) {
                  console.warn('[CHAT] Failed to parse call end (user):', e);
                }
              });

              // Error message subscriptions
              client.subscribe('/user/queue/errors', (message) => {
                console.error('[WS ERROR]:', message.body);
                set({ error: message.body });
              });

              client.subscribe('/user/queue/call-errors', (message) => {
                console.error('[CALL ERROR]:', message.body);
                // Handle call-specific errors
                get().handleCallMessage({
                  type: 'CALL_ERROR',
                  error: message.body
                });
              });

              console.log('All WebSocket subscriptions established successfully');

            } catch (subscriptionError) {
              console.error('Failed to set up subscriptions:', subscriptionError);
            }
          }

          set({ 
            stompClient: client, 
            connected: true, 
            connecting: false,
            error: null
          });
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          set({ 
            connecting: false, 
            connected: false,
            error: 'Failed to connect to chat server'
          });
        },
        onWebSocketError: (error) => {
          console.error('WebSocket error:', error);
          set({ 
            connecting: false, 
            connected: false,
            error: 'WebSocket connection failed'
          });
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          set({
            connected: false,
            stompClient: null
          });
        }
      });

      client.activate();

    } catch (error) {
      console.error('Chat connection error:', error);
      set({ 
        connecting: false, 
        connected: false,
        error: error.message || 'Connection failed'
      });
    }
  },

  disconnect: () => {
    const state = get();
    if (state.stompClient && state.connected) {
      state.stompClient.deactivate();
      console.log('Disconnected from WebSocket');
    }
    set({ 
      stompClient: null, 
      connected: false, 
      connecting: false,
      error: null
    });
  },

  // Message Handling
  sendMessage: async (receiverEmail, content) => {
    const state = get();
    if (!state.connected || !state.stompClient) {
      throw new Error('Not connected to chat server');
    }

    const messageData = {
      receiverEmail,
      content
    };

    // Send via WebSocket using the correct destination from API docs
    state.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(messageData)
    });
    console.debug('[CHAT] Sent message:', messageData);

    // Add optimistic message to local state
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderEmail: get().getCurrentUserEmail(),
      receiverEmail,
      content,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    get().addMessage(tempMessage);
  },

  handleIncomingMessage: (message) => {
    console.debug('[CHAT] Processing incoming message:', message);
    get().addMessage(message);
    
    // Update contact's last message and unread count
    const contacts = get().contacts.map(contact => {
      if (contact.email === message.senderEmail) {
        return {
          ...contact,
          lastMessagePreview: message.content,
          lastMessageTime: message.timestamp,
          unreadCount: (contact.unreadCount || 0) + 1
        };
      }
      return contact;
    });
    
    set({ contacts });
  },

  addMessage: (message) => {
    const state = get();
    const conversationKey = get().getConversationKey(message.senderEmail, message.receiverEmail);
    const currentMessages = state.messages[conversationKey] || [];
    
    // Avoid duplicates by ID
    const exists = currentMessages.some(m => m.id === message.id);
    if (exists) {
      return;
    }

    // Remove temp message if real message arrives
    let newMessages = [...currentMessages];
    if (message.id && !message.id.startsWith('temp-')) {
      newMessages = newMessages.filter(m => {
        const isTempMatch = m.id.startsWith('temp-') &&
                            m.content === message.content &&
                            m.receiverEmail === message.receiverEmail;
        return !isTempMatch;
      });
    }
    
    newMessages.push(message);
    newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    set({
      messages: {
        ...state.messages,
        [conversationKey]: newMessages
      }
    });
  },

  markAsRead: async (otherEmail) => {
    const state = get();
    if (!state.connected || !state.stompClient) {
      return;
    }

    const readData = {
      otherEmail // Server will derive myEmail from auth
    };

    // Send via WebSocket using the correct destination
    state.stompClient.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(readData)
    });

    // Also call REST API as backup
    try {
      await chatAPI.markMessagesAsRead(readData);
    } catch (error) {
      console.error('Failed to mark messages as read via REST:', error);
    }

    // Update local state immediately
    const myEmail = get().getCurrentUserEmail();
    const conversationKey = get().getConversationKey(myEmail, otherEmail);
    const messages = state.messages[conversationKey] || [];
    const updatedMessages = messages.map(msg => {
      if (msg.senderEmail === otherEmail && msg.status !== 'READ') {
        return { ...msg, status: 'read' };
      }
      return msg;
    });

    set({
      messages: {
        ...state.messages,
        [conversationKey]: updatedMessages
      }
    });

    // Update contact unread count
    const contacts = state.contacts.map(contact => {
      if (contact.email === otherEmail) {
        return { ...contact, unreadCount: 0 };
      }
      return contact;
    });

    set({ contacts });
  },

  handleReadReceipt: (readData) => {
    const state = get();
    const myEmail = readData.myEmail || readData.meEmail;
    const otherEmail = readData.otherEmail;

    if (!myEmail || !otherEmail) {
      console.warn('[CHAT] Read receipt missing emails:', readData);
      return;
    }

    const conversationKey = get().getConversationKey(myEmail, otherEmail);
    const messages = state.messages[conversationKey] || [];
    
    const updatedMessages = messages.map(msg => {
      if (msg.receiverEmail === myEmail && msg.status !== 'read') {
        return { ...msg, status: 'read' };
      }
      return msg;
    });

    set({
      messages: {
        ...state.messages,
        [conversationKey]: updatedMessages
      }
    });

    console.debug('[CHAT] Applied read receipt:', { myEmail, otherEmail });
  },

  // Typing Indicators
  sendTyping: (toEmail, typing) => {
    const state = get();
    if (!state.connected || !state.stompClient) {
      return;
    }

    const typingData = {
      toEmail,
      typing
    };

    // Send via WebSocket using the correct destination
    state.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(typingData)
    });
  },

  handleTypingIndicator: (typingData) => {
    console.debug('[CHAT] Processing typing indicator:', typingData);
    const state = get();
    const typingUsers = { ...state.typingUsers };
    
    if (typingData.typing) {
      typingUsers[typingData.fromEmail] = Date.now();
    } else {
      delete typingUsers[typingData.fromEmail];
    }

    set({ typingUsers });

    // Auto-remove typing indicator after 3 seconds
    if (typingData.typing) {
      setTimeout(() => {
        const currentState = get();
        const currentTyping = { ...currentState.typingUsers };
        if (currentTyping[typingData.fromEmail] === typingUsers[typingData.fromEmail]) {
          delete currentTyping[typingData.fromEmail];
          set({ typingUsers: currentTyping });
        }
      }, 3000);
    }
  },

  // Call Management
  handleCallMessage: (callData) => {
    console.debug('[CHAT] Processing call message:', callData);

    // Import call store dynamically to avoid circular dependency
    import('./callStore').then(({ useCallStore }) => {
      const callStore = useCallStore.getState();

      // Handle different types of call messages based on API documentation
      switch (callData.type) {
        case 'CALL_OFFER':
          callStore.handleCallOffer(callData);
          break;

        case 'CALL_RESPONSE':
          callStore.handleCallResponse(callData);
          break;

        case 'ICE_CANDIDATE':
          callStore.handleIceCandidate(callData);
          break;

        case 'CALL_STATUS':
          callStore.handleCallStatus(callData);
          break;

        case 'CALL_END':
          callStore.handleCallStatus({ ...callData, state: 'ENDED' });
          break;

        case 'CALL_ERROR':
          console.error('[CALL] Error received:', callData.error);
          callStore.endCall('ERROR');
          break;

        default:
          // Auto-detect message type from properties
          if (callData.sdpOffer) {
            callStore.handleCallOffer(callData);
          } else if (callData.sdpAnswer || callData.responseType) {
            callStore.handleCallResponse(callData);
          } else if (callData.candidate) {
            callStore.handleIceCandidate(callData);
          } else if (callData.state || callData.status) {
            callStore.handleCallStatus(callData);
          } else {
            console.warn('[CHAT] Unknown call message type:', callData);
          }
          break;
      }
    }).catch(error => {
      console.error('Failed to handle call message:', error);
    });
  },

  // Contact Management
  loadContacts: async () => {
    try {
      set({ contactsLoading: true });
      const contacts = await chatAPI.listContacts();
      set({ contacts, contactsLoading: false });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      set({ contactsLoading: false });
    }
  },

  addContact: async (contactEmail) => {
    try {
      const myEmail = get().getCurrentUserEmail();
      await chatAPI.addContact({
        meEmail: myEmail,
        contactEmail
      });
      
      // Reload contacts after adding
      await get().loadContacts();
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  },

  selectContact: (contact) => {
    set({ selectedContact: contact });
    
    // Load message history for the selected contact
    get().loadMessageHistory(contact.email);

    // Mark messages as read
    if (contact.unreadCount > 0) {
      get().markAsRead(contact.email);
    }
  },

  // Message History
  loadMessageHistory: async (otherEmail, page = 0) => {
    try {
      set({ messagesLoading: true });
      const response = await chatAPI.getMessageHistory(otherEmail, page);
      
      const conversationKey = get().getConversationKey(
        get().getCurrentUserEmail(),
        otherEmail
      );
      
      // Reverse to get chronological order (oldest first)
      const newMessages = response.items.slice().reverse();
      
      set({
        messages: {
          ...get().messages,
          [conversationKey]: newMessages
        },
        currentPage: {
          ...get().currentPage,
          [conversationKey]: page
        },
        messagesLoading: false
      });
      
    } catch (error) {
      console.error('Failed to load message history:', error);
      set({ messagesLoading: false });
    }
  },

  // Utility functions
  getCurrentUserEmail: () => {
    const state = get();
    if (state.currentUserEmail) {
      return state.currentUserEmail;
    }
    
    // Try to get from localStorage as fallback
    try {
      const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      return authStore?.state?.user?.email || null;
    } catch {
      return null;
    }
  },

  setCurrentUserEmail: (email) => {
    set({ currentUserEmail: email });
  },

  getConversationKey: (email1, email2) => {
    return [email1, email2].sort().join('_');
  },

  getMessagesForContact: (contactEmail) => {
    const state = get();
    const conversationKey = get().getConversationKey(
      get().getCurrentUserEmail(),
      contactEmail
    );
    return state.messages[conversationKey] || [];
  },

  isTyping: (contactEmail) => {
    const state = get();
    return !!state.typingUsers[contactEmail];
  },

  // Cleanup
  reset: () => {
    get().disconnect();
    set({
      currentUserEmail: null,
      contacts: [],
      selectedContact: null,
      messages: {},
      typingUsers: {},
      onlineUsers: new Set(),
      currentPage: {},
      error: null
    });
  }
}));