import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { aiChatAPI } from "../services/api";

export const useAiChat = () => {
  const currentUser = useAuthStore((s) => s.user);

  const normalizeMessages = (msgs) => {
    return (Array.isArray(msgs) ? msgs : []).map((m, i) => {
      let role = m.role || m.senderRole;
      if (!role) {
        const typeStr = (m.type || "").toUpperCase();
        if (typeStr.startsWith("USER")) {
          role = "user";
        } else if (typeStr.startsWith("AI")) {
          role = "assistant";
        } else {
          role = i % 2 === 0 ? "user" : "assistant";
        }
      } else {
        const r = role.toLowerCase();
        if (r === "ai" || r === "bot" || r === "model") role = "assistant";
      }

      let citations = m.citations;
      if (typeof citations === "string" && citations.trim().startsWith("[")) {
        try {
          citations = JSON.parse(citations);
        } catch (e) {
          citations = [];
        }
      }

      return {
        ...m,
        role,
        citations: Array.isArray(citations) ? citations : [],
        isEdited: m.isEdited || m.is_edited || false,
      };
    });
  };

  const [state, setState] = useState({
    isSidebarOpen: true,
    chatSessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    isLoadingSessions: true,
    showNewSessionModal: false,
    streamMode: true,
    enableWebSearch: false, // Default to clean LLM chat; user can toggle search on demand
    statusMessage: "",
    isListening: false,
    speechSupported: false,
    userMemories: [],
    showMemoryModal: false,
    editingMessage: null,
    activeGeneratingSessions: {}, // { [sessionId]: boolean }
  });

  // Multi-session in-memory message store: { [sessionId]: Array<ChatMessage> }
  const sessionMessagesMapRef = useRef({});
  const currentSessionIdRef = useRef(null);
  currentSessionIdRef.current = state.currentSessionId;

  const [newSessionName, setNewSessionName] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const updateState = (newState) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  };

  // Check speech recognition capability
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      updateState({ speechSupported: true });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.statusMessage]);

  // Auto-focus input when session changes
  useEffect(() => {
    if (state.currentSessionId && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.currentSessionId]);

  // Load initial sessions
  const loadSessions = useCallback(async () => {
    try {
      updateState({ isLoadingSessions: true });
      const rawSessions = await aiChatAPI.getUserChatSessions();
      const sessions = Array.isArray(rawSessions) ? rawSessions : (rawSessions?.data || []);
      updateState({ chatSessions: sessions });

      if (sessions.length > 0 && !currentSessionIdRef.current) {
        await selectSession(sessions[0].id);
      }
    } catch (error) {
      console.error("Failed to load initial sessions:", error);
      toast.error("Failed to load chat sessions");
    } finally {
      updateState({ isLoadingSessions: false });
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  const selectSession = async (sessionId) => {
    if (state.currentSessionId === sessionId) return;

    // Check if we have cached messages in memory for this session
    const cachedMessages = sessionMessagesMapRef.current[sessionId];
    const isCurrentlyGenerating = !!state.activeGeneratingSessions[sessionId];

    updateState({
      currentSessionId: sessionId,
      messages: cachedMessages || [],
      isLoading: !cachedMessages && !isCurrentlyGenerating,
      statusMessage: isCurrentlyGenerating ? "Generating response..." : "",
      editingMessage: null,
    });

    try {
      const sessionMessages = await aiChatAPI.getSessionMessages(sessionId);
      const normalized = normalizeMessages(sessionMessages);

      // Merge: if currently generating, keep optimistic placeholder at the end
      if (isCurrentlyGenerating && cachedMessages && cachedMessages.length > 0) {
        const lastCached = cachedMessages[cachedMessages.length - 1];
        if (lastCached && lastCached.streaming) {
          sessionMessagesMapRef.current[sessionId] = [...normalized, lastCached];
        } else {
          sessionMessagesMapRef.current[sessionId] = normalized;
        }
      } else {
        sessionMessagesMapRef.current[sessionId] = normalized;
      }

      if (currentSessionIdRef.current === sessionId) {
        updateState({
          messages: sessionMessagesMapRef.current[sessionId],
          isLoading: isCurrentlyGenerating,
        });
      }
    } catch (error) {
      console.error("Failed to load session messages:", error);
      if (!cachedMessages) toast.error("Failed to load messages");
    } finally {
      if (currentSessionIdRef.current === sessionId && !isCurrentlyGenerating) {
        updateState({ isLoading: false });
      }
    }
  };

  const createNewSession = async (customName) => {
    const title = (customName || newSessionName).trim();
    if (!title) {
      return toast.error("Please enter a session name");
    }
    try {
      const newSession = await aiChatAPI.createChatSession(title);
      sessionMessagesMapRef.current[newSession.id] = [];

      updateState({
        chatSessions: [newSession, ...state.chatSessions],
        currentSessionId: newSession.id,
        messages: [],
        showNewSessionModal: false,
      });
      setNewSessionName("");
      toast.success("New chat session created!");
      return newSession;
    } catch (error) {
      console.error("Failed to create new chat session:", error);
      toast.error("Failed to create new chat session");
    }
  };

  const renameSession = async (sessionId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      await aiChatAPI.updateChatSession(sessionId, { title: newTitle.trim() });
      updateState({
        chatSessions: state.chatSessions.map((s) =>
          s.id === sessionId ? { ...s, title: newTitle.trim() } : s
        ),
      });
      toast.success("Session renamed");
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("Failed to rename session");
    }
  };

  const deleteSession = async (sessionId, event) => {
    if (event) event.stopPropagation();
    try {
      await aiChatAPI.deleteChatSession(sessionId);
      delete sessionMessagesMapRef.current[sessionId];

      const remainingSessions = state.chatSessions.filter(
        (s) => s.id !== sessionId
      );
      updateState({ chatSessions: remainingSessions });
      toast.success("Chat session deleted");

      if (state.currentSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          await selectSession(remainingSessions[0].id);
        } else {
          updateState({ currentSessionId: null, messages: [] });
        }
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      toast.error("Failed to delete chat session");
    }
  };

  // Send message with multi-session background completion
  const sendTextMessage = async (messageContent) => {
    if (!messageContent.trim()) return;
    const targetSessionId = state.currentSessionId;
    if (!targetSessionId) {
      return toast.error("Please select or create a chat session first");
    }

    const tempUserId = `user-${Date.now()}`;
    const tempAiId = `ai-${Date.now()}`;

    const userMsg = {
      id: tempUserId,
      content: messageContent,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    const initialAiMsg = {
      id: tempAiId,
      content: "",
      role: "assistant",
      citations: [],
      streaming: true,
      createdAt: new Date().toISOString(),
    };

    // Update in-memory session map
    const existing = sessionMessagesMapRef.current[targetSessionId] || state.messages || [];
    const updatedWithPlaceholders = [...existing, userMsg, initialAiMsg];
    sessionMessagesMapRef.current[targetSessionId] = updatedWithPlaceholders;

    // Mark session as actively generating
    setState((prev) => ({
      ...prev,
      activeGeneratingSessions: { ...prev.activeGeneratingSessions, [targetSessionId]: true },
      ...(prev.currentSessionId === targetSessionId
        ? {
            isLoading: true,
            statusMessage: state.enableWebSearch ? "Searching web & analyzing..." : "Thinking...",
            messages: updatedWithPlaceholders,
          }
        : {}),
    }));

    if (state.streamMode) {
      await aiChatAPI.streamChatMessage({
        prompt: messageContent,
        sessionId: targetSessionId,
        webSearch: state.enableWebSearch,
        onStatus: (status) => {
          if (currentSessionIdRef.current === targetSessionId) {
            updateState({ statusMessage: status });
          }
        },
        onToken: (token) => {
          const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
          sessionMessagesMapRef.current[targetSessionId] = currentList.map((m) =>
            m.id === tempAiId ? { ...m, content: (m.content || "") + token } : m
          );

          if (currentSessionIdRef.current === targetSessionId) {
            setState((prev) => ({
              ...prev,
              statusMessage: "",
              messages: sessionMessagesMapRef.current[targetSessionId],
            }));
          }
        },
        onCitations: (citations) => {
          const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
          sessionMessagesMapRef.current[targetSessionId] = currentList.map((m) =>
            m.id === tempAiId ? { ...m, citations } : m
          );

          if (currentSessionIdRef.current === targetSessionId) {
            setState((prev) => ({
              ...prev,
              messages: sessionMessagesMapRef.current[targetSessionId],
            }));
          }
        },
        onDone: (finalAnswer) => {
          const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
          sessionMessagesMapRef.current[targetSessionId] = currentList.map((m) =>
            m.id === tempAiId
              ? { ...m, streaming: false, content: m.content || finalAnswer || "" }
              : m
          );

          setState((prev) => {
            const nextGenerating = { ...prev.activeGeneratingSessions };
            delete nextGenerating[targetSessionId];

            return {
              ...prev,
              activeGeneratingSessions: nextGenerating,
              ...(prev.currentSessionId === targetSessionId
                ? {
                    isLoading: false,
                    statusMessage: "",
                    messages: sessionMessagesMapRef.current[targetSessionId],
                  }
                : {}),
            };
          });
        },
        onError: async (err) => {
          console.warn(`Streaming issue for session ${targetSessionId}, falling back to standard API:`, err);
          try {
            const resp = await aiChatAPI.sendMessage(
              messageContent,
              targetSessionId,
              state.enableWebSearch
            );
            const normAi = {
              ...resp.aiMessage,
              role: "assistant",
              citations: resp.aiMessage?.citations ? JSON.parse(resp.aiMessage.citations) : [],
            };

            const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
            sessionMessagesMapRef.current[targetSessionId] = currentList.map((m) =>
              m.id === tempAiId ? normAi : m
            );

            setState((prev) => {
              const nextGenerating = { ...prev.activeGeneratingSessions };
              delete nextGenerating[targetSessionId];
              return {
                ...prev,
                activeGeneratingSessions: nextGenerating,
                ...(prev.currentSessionId === targetSessionId
                  ? {
                      isLoading: false,
                      statusMessage: "",
                      messages: sessionMessagesMapRef.current[targetSessionId],
                    }
                  : {}),
              };
            });
          } catch (fallbackErr) {
            console.error("Fallback also failed:", fallbackErr);
            toast.error("Failed to get AI response. Please try again.");

            const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
            sessionMessagesMapRef.current[targetSessionId] = currentList.filter((m) => m.id !== tempAiId);

            setState((prev) => {
              const nextGenerating = { ...prev.activeGeneratingSessions };
              delete nextGenerating[targetSessionId];
              return {
                ...prev,
                activeGeneratingSessions: nextGenerating,
                ...(prev.currentSessionId === targetSessionId
                  ? {
                      isLoading: false,
                      statusMessage: "",
                      messages: sessionMessagesMapRef.current[targetSessionId],
                    }
                  : {}),
              };
            });
          }
        },
      });
    } else {
      // Standard JSON mode
      try {
        const response = await aiChatAPI.sendMessage(
          messageContent,
          targetSessionId,
          state.enableWebSearch
        );
        const { userMessage: persistedUser, aiMessage } = response;
        const normUser = { ...persistedUser, role: "user" };
        let citList = [];
        if (typeof aiMessage.citations === "string" && aiMessage.citations.trim().startsWith("[")) {
          try { citList = JSON.parse(aiMessage.citations); } catch (e) {}
        } else if (Array.isArray(aiMessage.citations)) {
          citList = aiMessage.citations;
        }
        const normAi = { ...aiMessage, role: "assistant", citations: citList };

        const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
        sessionMessagesMapRef.current[targetSessionId] = [
          ...currentList.filter((m) => m.id !== tempUserId && m.id !== tempAiId),
          normUser,
          normAi,
        ];

        setState((prev) => {
          const nextGenerating = { ...prev.activeGeneratingSessions };
          delete nextGenerating[targetSessionId];
          return {
            ...prev,
            activeGeneratingSessions: nextGenerating,
            ...(prev.currentSessionId === targetSessionId
              ? {
                  isLoading: false,
                  messages: sessionMessagesMapRef.current[targetSessionId],
                }
              : {}),
          };
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");

        const currentList = sessionMessagesMapRef.current[targetSessionId] || [];
        sessionMessagesMapRef.current[targetSessionId] = currentList.filter(
          (m) => m.id !== tempUserId && m.id !== tempAiId
        );

        setState((prev) => {
          const nextGenerating = { ...prev.activeGeneratingSessions };
          delete nextGenerating[targetSessionId];
          return {
            ...prev,
            activeGeneratingSessions: nextGenerating,
            ...(prev.currentSessionId === targetSessionId
              ? {
                  isLoading: false,
                  messages: sessionMessagesMapRef.current[targetSessionId],
                }
              : {}),
          };
        });
      }
    }
  };

  // Edit and Resend a Message
  const editAndResendMessage = async (messageId, newContent) => {
    if (!newContent.trim() || state.isLoading) return;

    const currentList = sessionMessagesMapRef.current[state.currentSessionId] || state.messages;
    const msgIndex = currentList.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const previousMessages = currentList.slice(0, msgIndex);
    const updatedUserMsg = {
      ...currentList[msgIndex],
      content: newContent,
      isEdited: true,
    };

    const tempAiId = `ai-edit-${Date.now()}`;
    const placeholderAi = {
      id: tempAiId,
      content: "",
      role: "assistant",
      streaming: true,
      createdAt: new Date().toISOString(),
    };

    const newSessionMessages = [...previousMessages, updatedUserMsg, placeholderAi];
    sessionMessagesMapRef.current[state.currentSessionId] = newSessionMessages;

    updateState({
      editingMessage: null,
      isLoading: true,
      messages: newSessionMessages,
      statusMessage: "Updating and regenerating response...",
    });

    try {
      const response = await aiChatAPI.editChatMessage(messageId, {
        prompt: newContent,
        sessionId: state.currentSessionId,
        webSearch: state.enableWebSearch,
      });

      const { userMessage: persistedUser, aiMessage } = response;
      let citList = [];
      if (typeof aiMessage.citations === "string" && aiMessage.citations.trim().startsWith("[")) {
        try { citList = JSON.parse(aiMessage.citations); } catch (e) {}
      } else if (Array.isArray(aiMessage.citations)) {
        citList = aiMessage.citations;
      }
      const normAi = { ...aiMessage, role: "assistant", citations: citList };

      const finalList = [
        ...previousMessages,
        { ...persistedUser, role: "user", isEdited: true },
        normAi,
      ];
      sessionMessagesMapRef.current[state.currentSessionId] = finalList;

      updateState({
        isLoading: false,
        statusMessage: "",
        messages: finalList,
      });
      toast.success("Message edited & response regenerated");
    } catch (err) {
      console.error("Failed to edit message:", err);
      toast.error("Failed to edit message");
      updateState({ isLoading: false, statusMessage: "" });
    }
  };

  // Robust Speech-to-Text (STT) without stutter repetition
  const startSpeechToText = (baseText = "", onUpdate) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      const trimmedBase = (baseText || "").trim();
      let finalizedText = "";

      recognition.onstart = () => {
        updateState({ isListening: true });
      };

      recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalizedText += " " + item[0].transcript.trim();
          } else {
            interimText += " " + item[0].transcript.trim();
          }
        }

        const spokenPortion = `${finalizedText} ${interimText}`.trim();
        const combined = trimmedBase
          ? `${trimmedBase} ${spokenPortion}`.trim()
          : spokenPortion;

        if (onUpdate) {
          onUpdate(combined);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== "no-speech") {
          console.warn("Voice input notice:", event.error);
        }
        updateState({ isListening: false });
      };

      recognition.onend = () => {
        updateState({ isListening: false });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start voice recognition:", e);
      updateState({ isListening: false });
    }
  };

  const stopSpeechToText = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      updateState({ isListening: false });
    }
  };

  // User Memory management
  const loadUserMemories = async () => {
    try {
      const memories = await aiChatAPI.getUserMemories();
      updateState({ userMemories: Array.isArray(memories) ? memories : [] });
    } catch (e) {
      console.error("Failed to load user memories:", e);
    }
  };

  const deleteUserMemory = async (memoryId) => {
    try {
      await aiChatAPI.deleteUserMemory(memoryId);
      updateState({
        userMemories: state.userMemories.filter((m) => m.id !== memoryId),
      });
      toast.success("Memory deleted");
    } catch (e) {
      toast.error("Failed to delete memory");
    }
  };

  const currentSession = (Array.isArray(state.chatSessions) ? state.chatSessions : []).find(
    (s) => s.id === state.currentSessionId
  );

  return {
    state,
    currentSession,
    newSessionName,
    setNewSessionName,
    inputRef,
    messagesEndRef,
    actions: {
      setIsSidebarOpen: (isOpen) => updateState({ isSidebarOpen: isOpen }),
      setShowNewSessionModal: (show) => updateState({ showNewSessionModal: show }),
      setShowMemoryModal: (show) => {
        updateState({ showMemoryModal: show });
        if (show) loadUserMemories();
      },
      setStreamMode: (enabled) => updateState({ streamMode: enabled }),
      setEnableWebSearch: (enabled) => updateState({ enableWebSearch: enabled }),
      setEditingMessage: (msg) => updateState({ editingMessage: msg }),
      selectSession,
      createNewSession,
      renameSession,
      deleteSession,
      sendTextMessage,
      editAndResendMessage,
      startSpeechToText,
      stopSpeechToText,
      deleteUserMemory,
      loadUserMemories,
    },
  };
};
