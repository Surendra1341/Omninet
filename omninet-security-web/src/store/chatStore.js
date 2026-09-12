import { create } from 'zustand';
import { chatApi, chatWs } from '../services/chatService';
import { useAuthStore } from './authStore';

let typingTimeoutMap = new Map();

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {}, // conversationId -> Message[]
  nextCursorByConversation: {},
  hasMoreByConversation: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  connectionStatus: 'disconnected', // 'connected' | 'disconnected' | 'connecting'

  // Typing tracking: conversationId -> Map(userId -> { userName, timestamp })
  typingByConversation: {},

  // User presence: userId -> { status: 'ONLINE' | 'OFFLINE', lastSeen }
  presence: {},

  // Active composer state
  replyingTo: null,
  editingMessage: null,

  // Modals & Drawers
  isNewConvModalOpen: false,
  isGroupInfoOpen: false,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsNewConvModalOpen: (isOpen) => set({ isNewConvModalOpen: isOpen }),
  setIsGroupInfoOpen: (isOpen) => set({ isGroupInfoOpen: isOpen }),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),

  // ── Initialization & WebSocket binding ─────────────────────────────────
  init: async () => {
    set({ connectionStatus: 'connecting' });
    chatWs.connect();

    // Register WebSocket event listeners
    const unsubs = [
      chatWs.on('connection_change', ({ status }) => {
        set({ connectionStatus: status });
        if (status === 'connected') {
          get().loadConversations();
        }
      }),

      chatWs.on('new_message', (message) => {
        if (!message || !message.conversation_id) return;
        get().handleIncomingMessage(message);
      }),

      chatWs.on('message_edited', ({ message_id, conversation_id, content, updated_at }) => {
        get().handleMessageEdited(conversation_id, message_id, content, updated_at);
      }),

      chatWs.on('message_deleted', ({ message_id, conversation_id }) => {
        get().handleMessageDeleted(conversation_id, message_id);
      }),

      chatWs.on('message_status', (statusPayload) => {
        get().handleMessageStatus(statusPayload);
      }),

      chatWs.on('typing', ({ conversation_id, user_id, user_name }) => {
        get().handleTypingEvent(conversation_id, user_id, user_name);
      }),

      chatWs.on('presence', ({ user_id, status, last_seen }) => {
        set((state) => ({
          presence: {
            ...state.presence,
            [user_id]: { status, lastSeen: last_seen },
          },
        }));
      }),

      chatWs.on('reaction_update', ({ message_id, conversation_id, reactions }) => {
        get().handleReactionUpdate(conversation_id, message_id, reactions);
      }),

      chatWs.on('error', (err) => {
        console.warn('[chatStore] WebSocket error from server:', err);
      }),
    ];

    // Initial fetch of conversations
    await get().loadConversations();

    // Periodic presence polling every 12 seconds to ensure real-time accuracy across tabs
    const presenceTimer = setInterval(() => {
      const convs = get().conversations || [];
      const allUserIds = new Set();
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?.id || currentUser?.userId;

      convs.forEach((c) => {
        (c.members || []).forEach((m) => {
          const mid = m.user_id || m.userId;
          if (mid && mid !== currentUserId) {
            allUserIds.add(mid);
          }
        });
      });

      if (allUserIds.size > 0) {
        get().fetchPresence(Array.from(allUserIds));
      }
    }, 12000);

    return () => {
      clearInterval(presenceTimer);
      unsubs.forEach((unsub) => unsub && unsub());
    };
  },

  cleanup: () => {
    chatWs.disconnect();
    set({ connectionStatus: 'disconnected' });
  },

  // ── Conversation Actions ───────────────────────────────────────────────
  loadConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const convs = await chatApi.getConversations();
      set({ conversations: convs || [], isLoadingConversations: false });

      // Fetch initial presence for all members in all conversations
      const allUserIds = new Set();
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?.id || currentUser?.userId;
      (convs || []).forEach((c) => {
        (c.members || []).forEach((m) => {
          const mid = m.user_id || m.userId;
          if (mid && mid !== currentUserId) {
            allUserIds.add(mid);
          }
        });
      });

      if (allUserIds.size > 0) {
        get().fetchPresence(Array.from(allUserIds));
      }
    } catch (err) {
      console.error('[chatStore] Failed to load conversations:', err);
      set({ isLoadingConversations: false });
    }
  },

  setActiveConversation: async (id) => {
    if (!id) {
      set({ activeConversationId: null, replyingTo: null, editingMessage: null });
      return;
    }

    set({ activeConversationId: id, replyingTo: null, editingMessage: null });

    // Mark as read immediately
    chatWs.sendMarkRead(id);
    chatApi.markAsRead(id).catch(() => {});

    // Clear unread count in local conversation list
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unread_count: 0 } : c
      ),
    }));

    // If messages not loaded yet, fetch them
    const existing = get().messagesByConversation[id];
    if (!existing || existing.length === 0) {
      await get().loadMessages(id);
    }

    // Refresh presence for members in this conversation
    const currentConv = get().conversations.find((c) => c.id === id);
    if (currentConv?.members) {
      const memberIds = currentConv.members.map((m) => m.user_id || m.userId).filter(Boolean);
      get().fetchPresence(memberIds);
    }
  },

  loadMessages: async (conversationId, loadMore = false) => {
    const cursor = loadMore ? get().nextCursorByConversation[conversationId] : '';
    if (loadMore && !cursor) return;

    try {
      set({ isLoadingMessages: true });
      const data = await chatApi.getMessages(conversationId, cursor, 30);
      const newMessages = data?.messages || [];
      const nextCursor = data?.next_cursor || null;

      set((state) => {
        const existing = state.messagesByConversation[conversationId] || [];
        const combined = loadMore ? [...newMessages, ...existing] : newMessages;

        // Deduplicate by message ID
        const seen = new Set();
        const unique = combined.filter((m) => {
          if (!m || !m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: unique,
          },
          nextCursorByConversation: {
            ...state.nextCursorByConversation,
            [conversationId]: nextCursor,
          },
          hasMoreByConversation: {
            ...state.hasMoreByConversation,
            [conversationId]: !!nextCursor,
          },
          isLoadingMessages: false,
        };
      });
    } catch (err) {
      console.error('[chatStore] Failed to load messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  fetchPresence: async (userIds) => {
    try {
      const presenceData = await chatApi.getPresence(userIds);
      set((state) => ({
        presence: {
          ...state.presence,
          ...presenceData,
        },
      }));
    } catch (err) {
      console.error('[chatStore] Failed to fetch presence:', err);
    }
  },

  // ── Sending & Managing Messages ───────────────────────────────────────
  sendMessage: async (content) => {
    const { activeConversationId, replyingTo } = get();
    if (!activeConversationId || !content?.trim()) return;

    const trimmedContent = content.trim();
    const replyToId = replyingTo?.id || null;
    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?.id || currentUser?.userId || '';

    // Create optimistic message for instant UI feedback
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      sender_email: currentUser?.email || '',
      sender_name: currentUser?.name || currentUser?.email || 'Me',
      content: trimmedContent,
      type: 'TEXT',
      reply_to: replyingTo ? { ...replyingTo } : null,
      reply_to_id: replyToId,
      is_edited: false,
      status: 'SENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Reset reply state
    set({ replyingTo: null });

    // Instantly show the message in the conversation
    set((state) => {
      const existing = state.messagesByConversation[activeConversationId] || [];
      const updatedConversations = state.conversations.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            last_message: optimisticMsg,
            updated_at: optimisticMsg.created_at,
          };
        }
        return c;
      });

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [activeConversationId]: [...existing, optimisticMsg],
        },
        conversations: updatedConversations,
      };
    });

    // Send via WebSocket if connected, fallback to REST
    const sent = chatWs.sendMessage(activeConversationId, trimmedContent, replyToId);
    if (!sent) {
      try {
        const msg = await chatApi.sendMessage(activeConversationId, trimmedContent, replyToId);
        if (msg) {
          get().handleIncomingMessage(msg, tempId);
        }
      } catch (err) {
        console.error('[chatStore] Failed to send message via REST:', err);
      }
    }
  },

  editMessage: async (messageId, newContent) => {
    const { activeConversationId } = get();
    if (!messageId || !newContent?.trim()) return;

    try {
      set({ editingMessage: null });
      const updated = await chatApi.editMessage(messageId, newContent.trim());
      if (updated && activeConversationId) {
        get().handleMessageEdited(
          activeConversationId,
          messageId,
          updated.content,
          updated.updated_at
        );
      }
    } catch (err) {
      console.error('[chatStore] Failed to edit message:', err);
    }
  },

  deleteMessage: async (messageId) => {
    const { activeConversationId } = get();
    if (!messageId) return;

    try {
      await chatApi.deleteMessage(messageId);
      if (activeConversationId) {
        get().handleMessageDeleted(activeConversationId, messageId);
      }
    } catch (err) {
      console.error('[chatStore] Failed to delete message:', err);
    }
  },

  addReaction: async (messageId, emoji) => {
    // Send WS event
    const sent = chatWs.sendAddReaction(messageId, emoji);
    if (!sent) {
      chatApi.addReaction(messageId, emoji).catch(console.error);
    }
  },

  removeReaction: async (messageId, emoji) => {
    const sent = chatWs.sendRemoveReaction(messageId, emoji);
    if (!sent) {
      chatApi.removeReaction(messageId, emoji).catch(console.error);
    }
  },

  sendTyping: () => {
    const { activeConversationId } = get();
    if (activeConversationId) {
      chatWs.sendTyping(activeConversationId);
    }
  },

  createConversation: async (data) => {
    try {
      const conv = await chatApi.createConversation(data);
      if (conv) {
        set((state) => ({
          conversations: [conv, ...state.conversations.filter((c) => c.id !== conv.id)],
          activeConversationId: conv.id,
          isNewConvModalOpen: false,
        }));
        await get().loadMessages(conv.id);
        return conv;
      }
    } catch (err) {
      console.error('[chatStore] Failed to create conversation:', err);
      throw err;
    }
  },

  addMemberToGroup: async (convId, member) => {
    try {
      await chatApi.addMember(convId, member);
      await get().loadConversations();
    } catch (err) {
      console.error('[chatStore] Failed to add member:', err);
      throw err;
    }
  },

  removeMemberFromGroup: async (convId, userId) => {
    try {
      await chatApi.removeMember(convId, userId);
      await get().loadConversations();
    } catch (err) {
      console.error('[chatStore] Failed to remove member:', err);
      throw err;
    }
  },

  // ── Incoming Real-time Event Handlers ─────────────────────────────────
  handleIncomingMessage: (message, tempIdToReplace = null) => {
    const { activeConversationId } = get();
    const convId = message.conversation_id;
    const isCurrentActive = activeConversationId === convId;

    set((state) => {
      const existing = state.messagesByConversation[convId] || [];
      // If already present by permanent ID, don't duplicate
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      // Check if there is an optimistic temporary message to replace
      let replaced = false;
      const updatedMessages = existing.map((m) => {
        if (
          !replaced &&
          (m.id === tempIdToReplace ||
            (typeof m.id === 'string' &&
              m.id.startsWith('temp-') &&
              m.sender_id === message.sender_id &&
              m.content === message.content))
        ) {
          replaced = true;
          return message;
        }
        return m;
      });

      const finalMessages = replaced ? updatedMessages : [...existing, message];

      // Update conversation's last_message and unread_count
      const updatedConversations = state.conversations.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            last_message: message,
            unread_count: isCurrentActive ? 0 : (c.unread_count || 0) + 1,
            updated_at: message.created_at,
          };
        }
        return c;
      });

      // Sort conversations so the latest active conversation bubbles to the top
      updatedConversations.sort((a, b) => {
        const timeA = new Date(a.last_message?.created_at || a.updated_at || 0).getTime();
        const timeB = new Date(b.last_message?.created_at || b.updated_at || 0).getTime();
        return timeB - timeA;
      });

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [convId]: finalMessages,
        },
        conversations: updatedConversations,
      };
    });

    // If currently looking at this conversation, immediately mark it read
    if (isCurrentActive) {
      chatWs.sendMarkRead(convId, message.id);
    }
  },

  handleMessageEdited: (convId, messageId, content, updatedAt) => {
    set((state) => {
      const messages = state.messagesByConversation[convId] || [];
      const updated = messages.map((m) => {
        if (m.id === messageId) {
          return { ...m, content, is_edited: true, updated_at: updatedAt || new Date().toISOString() };
        }
        return m;
      });
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [convId]: updated,
        },
      };
    });
  },

  handleMessageDeleted: (convId, messageId) => {
    set((state) => {
      const messages = state.messagesByConversation[convId] || [];
      const filtered = messages.filter((m) => m.id !== messageId);
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [convId]: filtered,
        },
      };
    });
  },

  handleMessageStatus: ({ conversation_id, message_id, status }) => {
    set((state) => {
      const messages = state.messagesByConversation[conversation_id] || [];
      const updated = messages.map((m) => {
        if (m.id === message_id) {
          return { ...m, status };
        }
        return m;
      });
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversation_id]: updated,
        },
      };
    });
  },

  handleReactionUpdate: (convId, messageId, reactions) => {
    set((state) => {
      const messages = state.messagesByConversation[convId] || [];
      const updated = messages.map((m) => {
        if (m.id === messageId) {
          return { ...m, reactions };
        }
        return m;
      });
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [convId]: updated,
        },
      };
    });
  },

  handleTypingEvent: (convId, userId, userName) => {
    const currentUser = useAuthStore.getState().user;
    if (userId === currentUser?.id) return; // Don't show typing indicator for self

    set((state) => {
      const current = { ...(state.typingByConversation[convId] || {}) };
      current[userId] = { userName, timestamp: Date.now() };

      return {
        typingByConversation: {
          ...state.typingByConversation,
          [convId]: current,
        },
      };
    });

    // Auto clear typing state after 3.5 seconds
    const key = `${convId}_${userId}`;
    if (typingTimeoutMap.has(key)) {
      clearTimeout(typingTimeoutMap.get(key));
    }

    const timer = setTimeout(() => {
      set((state) => {
        const current = { ...(state.typingByConversation[convId] || {}) };
        delete current[userId];
        return {
          typingByConversation: {
            ...state.typingByConversation,
            [convId]: current,
          },
        };
      });
      typingTimeoutMap.delete(key);
    }, 3500);

    typingTimeoutMap.set(key, timer);
  },
}));