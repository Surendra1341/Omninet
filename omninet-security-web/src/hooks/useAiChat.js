import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { aiChatAPI } from "../services/api";

export const useAiChat = () => {
  const currentUser = useAuthStore((s) => s.user);
  const normalizeMessages = (msgs) => {
    // Simple parity-based tagging for historical messages
    return (Array.isArray(msgs) ? msgs : []).map((m, i) => ({
      ...m,
      role: i % 2 === 0 ? "user" : "assistant", // 1st (odd) -> user, 2nd (even) -> assistant
    }));
  };
  const [state, setState] = useState({
    isSidebarOpen: false,
    chatSessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    isLoadingSessions: true,
    showNewSessionModal: false,
  });

  const updateState = (newState) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  };

  const [newSessionName, setNewSessionName] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  // Auto-focus input when session changes
  useEffect(() => {
    if (state.currentSessionId && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.currentSessionId]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        updateState({ isLoadingSessions: true });
        const rawSessions = await aiChatAPI.getUserChatSessions();
        const sessions = Array.isArray(rawSessions) ? rawSessions : (rawSessions?.data || []);
        updateState({ chatSessions: sessions });

        if (sessions.length > 0) {
          const firstSession = sessions[0];
          await selectSession(firstSession.id);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast.error("Failed to load chat sessions");
      } finally {
        updateState({ isLoadingSessions: false });
      }
    };

    loadInitialData();
  }, []);

  const selectSession = async (sessionId) => {
    if (state.currentSessionId === sessionId) return;

    updateState({
      currentSessionId: sessionId,
      messages: [],
      isLoading: true,
    });
    try {
      const sessionMessages = await aiChatAPI.getSessionMessages(sessionId);
      updateState({ messages: normalizeMessages(sessionMessages) });
    } catch (error) {
      console.error("Failed to load session messages:", error);
      toast.error("Failed to load messages");
    } finally {
      updateState({ isLoading: false });
    }
  };

  const createNewSession = async () => {
    if (!newSessionName.trim()) {
      return toast.error("Please enter a session name");
    }
    try {
      const newSession = await aiChatAPI.createChatSession(
        newSessionName.trim()
      );
      updateState({
        chatSessions: [newSession, ...state.chatSessions],
        currentSessionId: newSession.id,
        messages: [],
        showNewSessionModal: false,
      });
      setNewSessionName("");
      toast.success("New chat session created!");
    } catch (error) {
      console.error("Failed to create new chat session:", error);
      toast.error("Failed to create new chat session");
    }
  };

  const deleteSession = async (sessionId, event) => {
    event.stopPropagation();
    try {
      await aiChatAPI.deleteChatSession(sessionId);
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

  const sendTextMessage = async (messageContent) => {
    if (!messageContent.trim() || state.isLoading) return;
    if (!state.currentSessionId) {
      return toast.error("Please select or create a chat session first");
    }

    const tempId = `temp-${Date.now()}`;
    const userMessage = {
      id: tempId,
      content: messageContent,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    // Add temp message
    setState((prevState) => ({
      ...prevState,
      isLoading: true,
      messages: [...prevState.messages, userMessage],
    }));

    try {
      const response = await aiChatAPI.sendMessage(
        messageContent,
        state.currentSessionId
      );

      const { userMessage: persistedUserMessage, aiMessage } = response;
      const finalUserMessage = { ...persistedUserMessage, role: "user" };
      const finalAiMessage = { ...aiMessage, role: "assistant" };

      // Replace temp message with real ones
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        messages: [
          ...prevState.messages.filter((m) => m.id !== tempId),
          finalUserMessage,
          finalAiMessage,
        ],
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");

      // Remove temp message on failure
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        messages: prevState.messages.filter((m) => m.id !== tempId),
      }));
    }
  };

  const handleVoiceMessage = async (audioFile) => {
    if (state.isLoading || !state.currentSessionId) {
      return toast.error("Please select or create a chat session first");
    }

    updateState({ isLoading: true });

    try {
      const audioBlob = await aiChatAPI.sendVoiceMessage(
        audioFile,
        state.currentSessionId
      );

      const sessionMessages = await aiChatAPI.getSessionMessages(
        state.currentSessionId
      );
      updateState({ messages: normalizeMessages(sessionMessages) });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error("Failed to send voice message:", error);
      toast.error("Failed to process voice message.");
    } finally {
      updateState({ isLoading: false });
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
      setShowNewSessionModal: (show) =>
        updateState({ showNewSessionModal: show }),
      selectSession,
      createNewSession,
      deleteSession,
      sendTextMessage,
      handleVoiceMessage,
    },
  };
};
