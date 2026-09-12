import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useChatStore } from '../../store/chatStore';

const COMMON_EMOJIS = [
  '😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥',
  '🎉', '✨', '👏', '🙌', '🚀', '💯', '🤝', '🥳', '😭', '🤯',
  '👀', '💡', '✅', '❌', '⭐', '☕', '💪', '🙏', '😴', '👋',
];

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  const {
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,
    sendTyping,
  } = useChatStore();

  // Populate textarea when entering edit mode
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Trigger typing event throttled to every 2 seconds
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 2000) {
      sendTyping();
      lastTypingTimeRef.current = now;
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;

    if (editingMessage) {
      editMessage(editingMessage.id, text.trim());
      setEditingMessage(null);
    } else {
      onSendMessage(text);
    }

    setText('');
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      if (replyingTo) setReplyingTo(null);
      if (editingMessage) {
        setEditingMessage(null);
        setText('');
      }
      setShowEmojiPicker(false);
    }
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative border-t border-base-300 bg-base-100 px-4 py-3">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-base-200 border-l-4 border-primary rounded-r-xl px-3 py-2 mb-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <ArrowUturnLeftIcon className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-base-content">
                Replying to {replyingTo.sender_name || replyingTo.sender_email}
              </span>
              <p className="text-base-content/60 truncate text-[11px]">{replyingTo.content}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-base-content/40 hover:text-base-content p-1"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between bg-base-200 border-l-4 border-secondary rounded-r-xl px-3 py-2 mb-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <PencilSquareIcon className="w-4 h-4 text-secondary shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-base-content">Editing message</span>
              <p className="text-base-content/60 truncate text-[11px]">{editingMessage.content}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="text-base-content/40 hover:text-base-content p-1"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 p-3 bg-base-100 border border-base-300 rounded-2xl shadow-xl z-30 grid grid-cols-6 gap-2 w-72 max-h-52 overflow-y-auto">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="text-lg p-1.5 hover:scale-125 active:scale-95 transition-transform rounded-lg hover:bg-base-200"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input controls container */}
      <div className="flex items-end gap-2 bg-base-200/70 border border-base-300 rounded-2xl px-3 py-1.5 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        {/* Emoji trigger button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-base-content/50 hover:text-primary p-1 rounded-full transition-colors shrink-0 mb-0.5"
          title="Insert emoji"
        >
          <FaceSmileIcon className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 bg-transparent text-base-content placeholder:text-base-content/40 text-xs sm:text-sm focus:outline-none resize-none max-h-32 py-1 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className={`btn btn-primary btn-sm btn-square rounded-xl shadow-xs transition-all shrink-0 mb-0.5 ${
            !text.trim() ? 'btn-disabled opacity-40' : ''
          }`}
          title="Send message"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
