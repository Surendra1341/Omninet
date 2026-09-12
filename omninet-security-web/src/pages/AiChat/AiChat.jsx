import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  Bars3Icon,
  PaperAirplaneIcon,
  SparklesIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  MicrophoneIcon,
  StopIcon,
  BoltIcon,
  BookmarkSquareIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAiChat } from "../../hooks/useAiChat";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
};

// Preprocess markdown to protect nested code fences from breaking outer code blocks
const normalizeMarkdownContent = (content) => {
  if (!content) return "";
  let text = content;

  // Protect outer code blocks containing nested code fences (e.g. ```markdown ... ```yaml ... ```)
  // by upgrading the outer block to ````
  text = text.replace(/(^|\n)```(markdown|md|html|text)?\n([\s\S]*?)(\n```(?:\n|$))/g, (match, prefix, lang, inner, suffix) => {
    if (inner.includes("```")) {
      const language = lang || "markdown";
      return `${prefix}\`\`\`\`${language}\n${inner}\n\`\`\`\`\n`;
    }
    return match;
  });

  return text;
};

// 1-Click Code Block with Copy
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative group my-3 rounded-xl overflow-hidden border border-base-300/80 bg-[#1e1e1e] shadow-sm lenis-prevent"
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
    >
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#252526] border-b border-white/5 text-[11px] text-gray-400 font-mono">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div
        className="text-xs sm:text-[13px] overflow-x-auto leading-relaxed lenis-prevent"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <SyntaxHighlighter
          language={language || "javascript"}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "12.5px",
          }}
          wrapLongLines={true}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Source Citations Component
const CitationsDeck = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-base-300/60">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-base-content/60 mb-2">
        <GlobeAltIcon className="w-3.5 h-3.5 text-primary" />
        <span>Sources & Citations ({citations.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {citations.map((c, idx) => {
          let domain = "";
          try {
            domain = new URL(c.url).hostname.replace(/^www\./, "");
          } catch (e) {
            domain = "web source";
          }
          return (
            <a
              key={idx}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-300/50 transition-all text-left group"
              title={c.snippet || c.title}
            >
              <span className="badge badge-xs badge-neutral mt-0.5 flex-shrink-0 font-mono">
                {c.index || idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-base-content group-hover:text-primary transition-colors truncate flex items-center gap-1">
                  <span className="truncate">{c.title || domain}</span>
                  <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                </div>
                <div className="text-[10px] text-base-content/50 truncate mt-0.5">
                  {domain}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

// Sidebar for Sessions
const Sidebar = ({
  isOpen,
  sessions,
  currentSession,
  isLoading,
  actions,
  onRenameSession,
  state,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-72 bg-base-100 border-r border-base-300 flex flex-col flex-shrink-0 transition-all duration-300 z-10">
      <div className="p-3.5 border-b border-base-300 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => actions.setShowNewSessionModal(true)}
          className="btn btn-primary btn-sm flex-1 gap-2 rounded-xl shadow-xs"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Chat</span>
        </button>
        <button
          type="button"
          onClick={() => actions.setShowMemoryModal(true)}
          className="btn btn-ghost btn-sm btn-square rounded-xl text-base-content/70 hover:text-base-content"
          title="User Memory & Context"
        >
          <BookmarkSquareIcon className="w-4 h-4" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2 space-y-1 lenis-prevent"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        onWheel={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
      >
        {isLoading ? (
          <div className="p-6 text-center">
            <span className="loading loading-spinner loading-sm text-primary"></span>
            <p className="mt-2 text-xs text-base-content/50">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-base-content/50">
            <p>No chat sessions yet.</p>
            <p className="mt-1">Click "New Chat" to begin.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = currentSession?.id === session.id;
            const isGenerating = !!state?.activeGeneratingSessions?.[session.id];
            return (
              <div
                key={session.id}
                onClick={() => actions.selectSession(session.id)}
                className={`p-3 rounded-xl cursor-pointer transition-colors group flex items-start justify-between ${
                  isSelected
                    ? "bg-primary/10 border-l-2 border-primary text-base-content font-medium"
                    : "hover:bg-base-200 text-base-content/80 border-l-2 border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-semibold truncate">
                      {session.title || "Untitled Conversation"}
                    </h3>
                    {isGenerating && (
                      <span
                        className="loading loading-spinner loading-xs text-primary flex-shrink-0"
                        title="Generating response in background..."
                      ></span>
                    )}
                  </div>
                  <p className="text-[11px] text-base-content/50 truncate mt-0.5">
                    {new Date(session.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameSession(session);
                    }}
                    className="text-base-content/40 hover:text-primary transition-all p-1 rounded-md"
                    title="Rename session"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => actions.deleteSession(session.id, e)}
                    className="text-base-content/40 hover:text-error transition-all p-1 rounded-md"
                    title="Delete session"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-base-300 text-[11px] text-base-content/50 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <CpuChipIcon className="w-3.5 h-3.5 text-primary" />
          <span>Gemini / Failover AI</span>
        </span>
        <span className="badge badge-xs badge-success badge-soft">Active</span>
      </div>
    </div>
  );
};

// Header Component
const ChatHeader = ({
  currentSession,
  onMenuClick,
  state,
  actions,
  onRenameSession,
}) => (
  <div className="bg-base-100/90 backdrop-blur-md border-b border-base-300 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
    <div className="flex items-center gap-3 min-w-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex items-center gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-base-content truncate max-w-xs sm:max-w-md">
              {currentSession ? currentSession.title : "AI Assistant"}
            </h1>
            {currentSession && (
              <button
                type="button"
                onClick={() => onRenameSession(currentSession)}
                className="text-base-content/40 hover:text-primary transition-colors p-0.5"
                title="Rename session"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-base-content/50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online &bull; Context Window Active</span>
          </p>
        </div>
      </div>
    </div>

    {/* Header Controls */}
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => actions.setEnableWebSearch(!state.enableWebSearch)}
        className={`btn btn-xs rounded-lg gap-1 transition-all ${
          state.enableWebSearch
            ? "btn-primary btn-soft"
            : "btn-ghost text-base-content/50"
        }`}
        title={state.enableWebSearch ? "Web Search Active" : "Web Search Off"}
      >
        <GlobeAltIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search</span>
      </button>

      <button
        type="button"
        onClick={() => actions.setStreamMode(!state.streamMode)}
        className={`btn btn-xs rounded-lg gap-1 transition-all ${
          state.streamMode
            ? "btn-secondary btn-soft"
            : "btn-ghost text-base-content/50"
        }`}
        title={state.streamMode ? "Fast Streaming Mode" : "Standard Mode"}
      >
        <BoltIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Stream</span>
      </button>

      <button
        type="button"
        onClick={() => actions.setShowMemoryModal(true)}
        className="btn btn-ghost btn-xs rounded-lg gap-1 text-base-content/70 hover:text-base-content"
        title="View persistent memory"
      >
        <BookmarkSquareIcon className="w-3.5 h-3.5 text-primary" />
        <span className="hidden md:inline">Memory</span>
      </button>
    </div>
  </div>
);

// Individual Message Component
const Message = ({ message, onEditAndResend }) => {
  const role = (message.role || "").toString().toLowerCase();
  const isAssistant =
    role === "assistant" || role === "ai" || role === "bot" || role === "model";

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onEditAndResend(message.id, editContent);
    setIsEditing(false);
  };

  return (
    <div className={`flex mb-4 group ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-xs sm:max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-xs transition-all ${
          isAssistant
            ? "bg-base-100 text-base-content rounded-tl-xs border border-base-300 w-full"
            : "bg-primary text-primary-content rounded-tr-xs"
        }`}
      >
        {/* User Message Edit Mode */}
        {!isAssistant && isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="textarea textarea-bordered textarea-sm w-full bg-base-100 text-base-content rounded-xl"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditContent(message.content || "");
                  setIsEditing(false);
                }}
                className="btn btn-ghost btn-xs text-primary-content hover:bg-black/20 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn btn-neutral btn-xs rounded-lg shadow-xs"
              >
                Save & Resend
              </button>
            </div>
          </div>
        ) : (
          /* Normal Message Body */
          <>
            {isAssistant ? (
              <div>
                <div className="prose prose-sm max-w-none text-base-content prose-headings:text-base-content prose-strong:text-base-content prose-a:text-primary prose-a:underline">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, "")}
                          />
                        ) : (
                          <code
                            className="bg-base-200 text-primary px-1.5 py-0.5 rounded font-mono text-xs"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      img({ node, ...props }) {
                        return (
                          <img
                            className="max-w-full h-auto rounded-lg my-2 inline-block border border-base-300/40 shadow-xs"
                            loading="lazy"
                            {...props}
                          />
                        );
                      },
                      table({ node, ...props }) {
                        return (
                          <div
                            className="overflow-x-auto my-3 rounded-xl border border-base-300/60 lenis-prevent"
                            data-lenis-prevent="true"
                            data-lenis-prevent-wheel="true"
                            onWheel={(e) => e.stopPropagation()}
                          >
                            <table className="table table-zebra table-xs w-full" {...props} />
                          </div>
                        );
                      },
                      a({ node, children, href, ...props }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:opacity-80 transition-opacity break-words"
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {normalizeMarkdownContent(message.content || "")}
                  </ReactMarkdown>
                </div>

                {message.streaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />
                )}

                {/* Sources & Citations */}
                <CitationsDeck citations={message.citations} />

                {/* Assistant Footer Actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-300/40 text-[10px] text-base-content/40">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="hover:text-base-content transition-colors flex items-center gap-1"
                      title="Copy entire response"
                    >
                      {copied ? (
                        <CheckIcon className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <ClipboardDocumentIcon className="w-3 h-3" />
                      )}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <span>{formatTime(message.createdAt)}</span>
                </div>
              </div>
            ) : (
              /* User Message Body */
              <div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {message.content}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] text-primary-content/75 select-none">
                  <div className="flex items-center gap-1.5">
                    {message.isEdited && (
                      <span className="badge badge-xs bg-black/20 text-primary-content border-none">
                        Edited
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity flex items-center gap-0.5"
                      title="Edit and resend"
                    >
                      <PencilSquareIcon className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <span>{formatTime(message.createdAt)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Message Area Component with Trackpad / Mouse Wheel lenis-prevent
const MessageArea = ({
  messages,
  isLoading,
  statusMessage,
  messagesEndRef,
  onEditAndResend,
}) => (
  <div
    className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-base-200/30 lenis-prevent"
    data-lenis-prevent="true"
    data-lenis-prevent-wheel="true"
    data-lenis-prevent-touch="true"
    onWheel={(e) => e.stopPropagation()}
    style={{
      overscrollBehavior: "contain",
      touchAction: "pan-y",
      WebkitOverflowScrolling: "touch",
    }}
  >
    <div className="max-w-4xl mx-auto space-y-3">
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          onEditAndResend={onEditAndResend}
        />
      ))}

      {/* Live Status indicator */}
      {isLoading && statusMessage && (
        <div className="flex justify-start">
          <div className="bg-base-100 border border-base-300 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="loading loading-dots loading-xs text-primary"></span>
              <span className="text-xs font-medium text-base-content/70">
                {statusMessage}
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  </div>
);

// Welcome Screen
const WelcomeScreen = ({ onStartNewChat, actions, state }) => {
  const suggestions = [
    "Search recent AI security vulnerabilities and summarize mitigation steps",
    "Explain the difference between JWT and OAuth2 session tokens with code",
    "Review our microservice architecture and suggest scaling best practices",
    "Help me debug an internal server error in Spring Boot / Vite application",
  ];

  return (
    <div className="flex-1 flex items-center justify-center h-full p-6 bg-base-200/30">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
          <SparklesIcon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-base-content mb-1">
          Modern AI Assistant
        </h2>
        <p className="text-xs text-base-content/60 mb-6 leading-relaxed max-w-md mx-auto">
          Powered by Gemini with automatic failover, real-time live web search, persistent user memory, and code generation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left mb-6">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={async () => {
                const sess = await actions.createNewSession("New Chat");
                if (sess) {
                  setTimeout(() => actions.sendTextMessage(s), 300);
                }
              }}
              className="p-3 rounded-xl bg-base-100 hover:bg-base-200/80 border border-base-300/80 text-xs text-base-content/80 transition-all hover:border-primary/40 shadow-xs"
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onStartNewChat}
          className="btn btn-primary btn-sm rounded-xl gap-2 shadow-xs"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Start New Conversation</span>
        </button>
      </div>
    </div>
  );
};

// Chat Input Box
const ChatInput = ({
  value,
  setValue,
  onSendMessage,
  isLoading,
  inputRef,
  state,
  actions,
}) => {
  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSendMessage(value);
    setValue("");
    inputRef?.current?.focus();
  };

  const handleVoiceToggle = () => {
    if (state.isListening) {
      actions.stopSpeechToText();
    } else {
      actions.startSpeechToText(value, (fullText) => {
        setValue(fullText);
      });
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-base-100 border-t border-base-300 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <form
          className="flex items-center gap-2 bg-base-200/70 border border-base-300 rounded-2xl px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          {/* Voice Input Button */}
          {state.speechSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`btn btn-ghost btn-xs btn-square rounded-xl transition-all ${
                state.isListening
                  ? "text-error animate-pulse bg-error/10"
                  : "text-base-content/50 hover:text-base-content"
              }`}
              title={state.isListening ? "Stop listening" : "Speak (Voice input)"}
            >
              {state.isListening ? (
                <StopIcon className="w-4 h-4" />
              ) : (
                <MicrophoneIcon className="w-4 h-4" />
              )}
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              state.isListening
                ? "Listening to voice... speak now..."
                : "Ask anything, search the web, or write code... (Enter to send)"
            }
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

        <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-base-content/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <GlobeAltIcon className="w-3 h-3 text-primary" />
              <span>Web Search: {state.enableWebSearch ? "Enabled" : "Disabled"}</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <BoltIcon className="w-3 h-3 text-secondary" />
              <span>SSE Streaming: {state.streamMode ? "On" : "Off"}</span>
            </span>
          </div>
          <span className="hidden sm:inline">Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

// Memory Modal
const UserMemoryModal = ({ show, onClose, memories, onDelete }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-base-300 lenis-prevent"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookmarkSquareIcon className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-base-content">
              User Memory & Cross-Session Context
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-base-content/60 mb-4 leading-relaxed">
          The AI automatically extracts facts and preferences across your conversations to provide persistent context. You can review or delete memories here.
        </p>

        <div
          className="max-h-64 overflow-y-auto space-y-2 mb-4 pr-1 lenis-prevent"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          onWheel={(e) => e.stopPropagation()}
        >
          {memories.length === 0 ? (
            <div className="text-center py-6 text-xs text-base-content/40">
              No memories stored yet. As you chat, key preferences and facts will be remembered.
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-base-200/50 border border-base-300/60 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base-content">{m.memoryKey}</div>
                  <div className="text-base-content/70 mt-0.5">{m.memoryValue}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  className="text-base-content/40 hover:text-error transition-colors p-1"
                  title="Delete memory"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm rounded-xl text-base-content/70"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal for Creating New Session
const NewSessionModal = ({
  show,
  onClose,
  onCreate,
  newSessionName,
  setNewSessionName,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-base-300 lenis-prevent"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold mb-3 text-base-content">
          Create New Chat Session
        </h3>
        <input
          type="text"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="Enter session name..."
          className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 mb-4 focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && onCreate()}
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
            onClick={onCreate}
            className="btn btn-primary btn-sm rounded-xl shadow-xs"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal for Renaming Session
const RenameSessionModal = ({ session, onClose, onSave }) => {
  if (!session) return null;
  const [title, setTitle] = useState(session.title || "");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-base-300 lenis-prevent"
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold mb-3 text-base-content">
          Rename Chat Session
        </h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New session title..."
          className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 mb-4 focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && onSave(session.id, title)}
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
            onClick={() => onSave(session.id, title)}
            className="btn btn-primary btn-sm rounded-xl shadow-xs"
          >
            Save
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

  const [inputValue, setInputValue] = useState("");
  const [renameTargetSession, setRenameTargetSession] = useState(null);

  // Global key handler: start typing anywhere to fill the input
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
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

      if (e.key === "Enter") {
        e.preventDefault();
        if (inputValue.trim() && !state.isLoading) {
          actions.sendTextMessage(inputValue);
          setInputValue("");
          inputRef?.current?.focus();
        }
        return;
      }

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
        state={state}
        onRenameSession={(s) => setRenameTargetSession(s)}
      />

      <div
        className="flex-1 flex flex-col h-full min-w-0"
        onClick={(e) => {
          const target = e.target;
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
          state={state}
          actions={actions}
          onRenameSession={(s) => setRenameTargetSession(s)}
        />

        {state.currentSessionId ? (
          <>
            <MessageArea
              messages={state.messages}
              isLoading={state.isLoading}
              statusMessage={state.statusMessage}
              messagesEndRef={messagesEndRef}
              onEditAndResend={actions.editAndResendMessage}
            />
            <ChatInput
              value={inputValue}
              setValue={setInputValue}
              onSendMessage={actions.sendTextMessage}
              isLoading={state.isLoading}
              inputRef={inputRef}
              state={state}
              actions={actions}
            />
          </>
        ) : (
          <WelcomeScreen
            onStartNewChat={() => actions.setShowNewSessionModal(true)}
            actions={actions}
            state={state}
          />
        )}
      </div>

      <NewSessionModal
        show={state.showNewSessionModal}
        onClose={() => actions.setShowNewSessionModal(false)}
        onCreate={() => actions.createNewSession()}
        newSessionName={newSessionName}
        setNewSessionName={setNewSessionName}
      />

      <RenameSessionModal
        session={renameTargetSession}
        onClose={() => setRenameTargetSession(null)}
        onSave={(id, newTitle) => {
          actions.renameSession(id, newTitle);
          setRenameTargetSession(null);
        }}
      />

      <UserMemoryModal
        show={state.showMemoryModal}
        onClose={() => actions.setShowMemoryModal(false)}
        memories={state.userMemories}
        onDelete={actions.deleteUserMemory}
      />
    </div>
  );
}

export default AiChat;
