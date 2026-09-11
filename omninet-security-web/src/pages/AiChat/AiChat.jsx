import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAiChat } from "../../hooks/useAiChat";

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const Sidebar = ({ isOpen, sessions, currentSession, isLoading, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => actions.setShowNewSessionModal(true)}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Chat</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No chat sessions yet.</p>
            <p className="text-sm">Create one to get started!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => actions.selectSession(session.id)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group ${
                currentSession?.id === session.id
                  ? "bg-blue-50 border-r-4 border-r-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">
                    {session.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => actions.deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1 rounded ml-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ChatHeader = ({ currentSession, onMenuClick }) => (
  <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-4 flex-shrink-0">
    <button
      onClick={onMenuClick}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
    <div className="flex-1">
      <h1 className="text-xl font-semibold text-gray-800">
        {currentSession ? currentSession.title : "AI Assistant"}
      </h1>
      <p className="text-sm text-gray-500">
        {currentSession ? "Online" : "Select a session to start"}
      </p>
    </div>
  </div>
);

const Message = ({ message }) => {
  const role = (message.role || "").toString().toLowerCase();
  const isAssistant =
    role === "assistant" || role === "ai" || role === "bot" || role === "model";
  return (
    <div
      className={`flex mb-4 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm border ${
          isAssistant
            ? "bg-gray-100 text-gray-800 rounded-bl-none"
            : "bg-blue-500 text-white rounded-br-none"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none text-gray-800 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-code:before:content-[''] prose-code:after:content-['']">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || ""}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        )}
        <div
          className={`text-xs mt-1 ${
            isAssistant ? "text-gray-500 text-left" : "text-blue-100 text-right"
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

const MessageArea = ({ messages, isLoading, messagesEndRef }) => (
  <div className="flex-1 overflow-y-auto p-4 min-h-0 chat-bg-violet">
    <div className="max-w-4xl mx-auto space-y-4">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 border rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">AI is typing...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  </div>
);

const WelcomeScreen = ({ onStartNewChat }) => (
  <div className="flex-1 flex items-center justify-center h-full p-4 chat-bg-violet">
    <div className="text-center">
      <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 p-1">
        <img
          src="/ordAI.gif"
          alt="AI Assistant"
          className="w-full h-full object-cover rounded-full select-none pointer-events-none"
          draggable={false}
        />
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        Welcome to AI Assistant
      </h2>
      <p className="text-gray-500 mb-6">
        Create a new chat session to start your conversation.
      </p>
      <button
        onClick={onStartNewChat}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Start New Chat
      </button>
    </div>
  </div>
);

const ChatInput = ({ value, setValue, onSendMessage, isLoading, inputRef }) => {
  const handleSend = () => {
    onSendMessage(value);
    setValue("");
    // Keep the typing flow smooth by refocusing the input after send
    inputRef?.current?.focus();
  };

  // Enter handling will be done via form onSubmit to ensure consistency

  return (
    <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <form
          className="flex items-center space-x-3 bg-gray-100 rounded-full px-4 py-2"
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
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl p-6 w-full max-w-md border border-white/20">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Create New Chat Session
        </h3>
        <input
          type="text"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="Enter session name..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === "Enter" && handleCreate()}
          autoFocus
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
    <div className="flex bg-gray-100 overflow-hidden w-full h-[calc(100dvh-72px)] md:h-[calc(100dvh-80px)]">
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
