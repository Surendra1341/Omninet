import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  PlusIcon,
  TrashIcon,
  Bars3Icon,
  PaperAirplaneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAiChat } from "../../hooks/useAiChat";

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const Sidebar = ({ isOpen, sessions, currentSession, isLoading, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="w-72 bg-base-100 border-r border-base-300 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="p-3.5 border-b border-base-300">
        <button
          type="button"
          onClick={() => actions.setShowNewSessionModal(true)}
          className="btn btn-primary btn-sm w-full gap-2 rounded-xl shadow-xs"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-6 text-center">
            <span className="loading loading-spinner loading-sm text-primary"></span>
            <p className="mt-2 text-xs text-base-content/50">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-base-content/50">
            <p>No chat sessions yet.</p>
            <p className="mt-1">Create one to get started.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = currentSession?.id === session.id;
            return (
              <div
                key={session.id}
                onClick={() => actions.selectSession(session.id)}
                className={`p-3 rounded-xl cursor-pointer transition-colors group flex items-start justify-between ${
                  isSelected
                    ? "bg-primary/10 border-l-2 border-primary text-base-content"
                    : "hover:bg-base-200 text-base-content/80 border-l-2 border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-xs font-semibold truncate">
                    {session.title || "Untitled Chat"}
                  </h3>
                  <p className="text-[11px] text-base-content/50 truncate mt-0.5">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => actions.deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-base-content/40 hover:text-error transition-all p-1 rounded-md"
                  title="Delete session"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ChatHeader = ({ currentSession, onMenuClick }) => (
  <div className="bg-base-100/90 backdrop-blur-md border-b border-base-300 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-sm font-semibold text-base-content">
          {currentSession ? currentSession.title : "AI Assistant"}
        </h1>
        <p className="text-xs text-base-content/50">
          {currentSession ? "Online" : "Select a session or create a new one"}
        </p>
      </div>
    </div>
  </div>
);

const Message = ({ message }) => {
  const role = (message.role || "").toString().toLowerCase();
  const isAssistant =
    role === "assistant" || role === "ai" || role === "bot" || role === "model";
  return (
    <div
      className={`flex mb-3 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-xl px-4 py-2.5 rounded-2xl shadow-2xs text-xs sm:text-sm ${
          isAssistant
            ? "bg-base-100 text-base-content rounded-tl-xs border border-base-300"
            : "bg-primary text-primary-content rounded-tr-xs"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none text-base-content prose-pre:bg-base-300 prose-pre:text-base-content prose-pre:p-3 prose-pre:rounded-xl prose-code:before:content-[''] prose-code:after:content-['']">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || ""}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        )}
        <div
          className={`text-[10px] mt-1 select-none ${
            isAssistant ? "text-base-content/40 text-left" : "text-primary-content/70 text-right"
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

const MessageArea = ({ messages, isLoading, messagesEndRef }) => (
  <div className="flex-1 overflow-y-auto p-5 min-h-0 bg-base-200/30">
    <div className="max-w-4xl mx-auto space-y-3">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-base-100 border border-base-300 rounded-2xl rounded-tl-xs px-4 py-2 shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="loading loading-dots loading-xs text-primary"></span>
              <span className="text-xs text-base-content/50">Assistant is thinking...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  </div>
);

const WelcomeScreen = ({ onStartNewChat }) => (
  <div className="flex-1 flex items-center justify-center h-full p-6 bg-base-200/30">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
        <SparklesIcon className="w-8 h-8" />
      </div>
      <h2 className="text-base font-semibold text-base-content mb-1">
        Contextual AI Assistant
      </h2>
      <p className="text-xs text-base-content/60 mb-5 leading-relaxed">
        Start a conversation to draft content, summarize your notes, organize tasks, and explore ideas cleanly.
      </p>
      <button
        type="button"
        onClick={onStartNewChat}
        className="btn btn-primary btn-sm rounded-xl gap-2 shadow-xs"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Start New Chat</span>
      </button>
    </div>
  </div>
);

const ChatInput = ({ value, setValue, onSendMessage, isLoading, inputRef }) => {
  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSendMessage(value);
    setValue("");
    inputRef?.current?.focus();
  };

  return (
    <div className="p-4 bg-base-100 border-t border-base-300 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <form
          className="flex items-center gap-2 bg-base-200/70 border border-base-300 rounded-2xl px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your message... (Enter to send)"
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-base-content placeholder:text-base-content/40 py-1"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={`btn btn-primary btn-sm btn-square rounded-xl shadow-xs transition-all ${
              !value.trim() || isLoading ? "btn-disabled opacity-40" : ""
            }`}
            title="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

const NewSessionModal = ({
  show,
  onClose,
  onCreate,
  newSessionName,
  setNewSessionName,
}) => {
  if (!show) return null;

  const handleCreate = () => {
    onCreate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-base-300">
        <h3 className="text-sm font-semibold mb-3 text-base-content">
          Create New Chat Session
        </h3>
        <input
          type="text"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="Enter session name..."
          className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 mb-4 focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm text-base-content/70 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="btn btn-primary btn-sm rounded-xl shadow-xs"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

function AiChat() {
  const {
    state,
    currentSession,
    newSessionName,
    setNewSessionName,
    inputRef,
    messagesEndRef,
    actions,
  } = useAiChat();

  // Controlled input value for seamless global typing
  const [inputValue, setInputValue] = useState("");

  // Global key handler: start typing anywhere to fill the input
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      // Ignore when user is typing in another editable element
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("input, textarea, select, [contenteditable='true']"))
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Enter to send globally
      if (e.key === "Enter") {
        e.preventDefault();
        if (inputValue.trim() && !state.isLoading) {
          actions.sendTextMessage(inputValue);
          setInputValue("");
          inputRef?.current?.focus();
        }
        return;
      }

      // Printable characters
      if (e.key && e.key.length === 1) {
        e.preventDefault();
        setInputValue((prev) => prev + e.key);
        inputRef?.current?.focus();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        setInputValue((prev) => prev.slice(0, -1));
        inputRef?.current?.focus();
        return;
      }

      if (e.key === "Spacebar" || e.key === " ") {
        e.preventDefault();
        setInputValue((prev) => prev + " ");
        inputRef?.current?.focus();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputRef, inputValue, state.isLoading, actions]);

  return (
    <div className="flex bg-base-100 overflow-hidden w-full h-[calc(100dvh-72px)] md:h-[calc(100dvh-80px)]">
      <Sidebar
        isOpen={state.isSidebarOpen}
        sessions={state.chatSessions}
        currentSession={currentSession}
        isLoading={state.isLoadingSessions}
        actions={actions}
      />
      <div
        className="flex-1 flex flex-col h-full min-w-0"
        onClick={(e) => {
          const target = e.target;
          // Avoid stealing focus from interactive elements
          if (
            target.closest(
              'button, [role="button"], a, input, textarea, select, [contenteditable="true"]'
            )
          )
            return;
          inputRef?.current?.focus();
        }}
      >
        <ChatHeader
          currentSession={currentSession}
          onMenuClick={() => actions.setIsSidebarOpen(!state.isSidebarOpen)}
        />
        {state.currentSessionId ? (
          <>
            <MessageArea
              messages={state.messages}
              isLoading={state.isLoading}
              messagesEndRef={messagesEndRef}
            />
            <ChatInput
              value={inputValue}
              setValue={setInputValue}
              onSendMessage={actions.sendTextMessage}
              isLoading={state.isLoading}
              inputRef={inputRef}
            />
          </>
        ) : (
          <WelcomeScreen
            onStartNewChat={() => actions.setShowNewSessionModal(true)}
          />
        )}
      </div>
      <NewSessionModal
        show={state.showNewSessionModal}
        onClose={() => actions.setShowNewSessionModal(false)}
        onCreate={actions.createNewSession}
        newSessionName={newSessionName}
        setNewSessionName={setNewSessionName}
      />
    </div>
  );
}

export default AiChat;
