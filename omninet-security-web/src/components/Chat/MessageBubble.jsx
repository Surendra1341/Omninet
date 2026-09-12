import React, { useState } from 'react';
import {
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '😮'];

const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const MessageBubble = ({
  message,
  isGroup = false,
  onReply,
  onEdit,
  onDelete,
  onScrollToMessage,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const { addReaction, removeReaction } = useChatStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwn = message.sender_id === currentUser?.id || message.sender_email === currentUser?.email;

  // Aggregate reactions: { '👍': ['uid1', 'uid2'], ... }
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([_, uids]) => uids && uids.length > 0);

  const handleToggleReaction = (emoji) => {
    const userIds = reactions[emoji] || [];
    const hasReacted = userIds.includes(currentUser?.id);
    if (hasReacted) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col mb-3 transition-colors ${
        isOwn ? 'items-end' : 'items-start'
      }`}
    >
      {/* Group sender name for incoming message */}
      {!isOwn && isGroup && (
        <span className="text-[11px] font-medium text-base-content/60 mb-1 ml-3 select-none">
          {message.sender_name || message.sender_email}
        </span>
      )}

      {/* Bubble container */}
      <div className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Hover action bar */}
        <div
          className={`absolute top-0 -translate-y-full mb-1 z-10 flex items-center gap-0.5 bg-base-100/95 backdrop-blur-md px-1.5 py-1 rounded-full border border-base-300 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-150 ${
            isOwn ? 'right-0' : 'left-0'
          }`}
        >
          {/* Quick reactions */}
          <div className="flex items-center gap-0.5 px-1 border-r border-base-300">
            {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleReaction(emoji)}
                className="hover:scale-125 active:scale-95 transition-transform p-0.5 text-xs"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-base-content/50 hover:text-base-content p-0.5"
                title="More reactions"
              >
                <FaceSmileIcon className="w-3.5 h-3.5" />
              </button>
              {showEmojiPicker && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 bg-base-100 border border-base-300 p-1.5 rounded-xl shadow-xl z-20"
                  onMouseLeave={() => setShowEmojiPicker(false)}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleToggleReaction(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-125 transition-transform p-1 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reply button */}
          <button
            type="button"
            onClick={() => onReply && onReply(message)}
            className="text-base-content/60 hover:text-primary p-1 rounded-md hover:bg-base-200 transition-colors"
            title="Reply"
          >
            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
          </button>

          {/* Edit button (own only) */}
          {isOwn && (
            <button
              type="button"
              onClick={() => onEdit && onEdit(message)}
              className="text-base-content/60 hover:text-primary p-1 rounded-md hover:bg-base-200 transition-colors"
              title="Edit message"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete button (own only) */}
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete && onDelete(message.id)}
              className="text-base-content/60 hover:text-error p-1 rounded-md hover:bg-base-200 transition-colors"
              title="Delete message"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* The message bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 shadow-2xs text-xs sm:text-sm break-words transition-all ${
            isOwn
              ? 'bg-primary text-primary-content rounded-tr-xs'
              : 'bg-base-100 text-base-content rounded-tl-xs border border-base-300'
          }`}
        >
          {/* Reply-to quote snippet */}
          {message.reply_to && (
            <div
              onClick={() => onScrollToMessage && onScrollToMessage(message.reply_to.id)}
              className={`mb-2 p-2 rounded-lg cursor-pointer border-l-2 text-xs transition-opacity hover:opacity-90 ${
                isOwn
                  ? 'bg-primary-content/15 border-primary-content text-primary-content'
                  : 'bg-base-200 border-primary text-base-content'
              }`}
            >
              <span className="font-semibold block text-[11px] opacity-90">
                {message.reply_to.sender_name || message.reply_to.sender_email || 'Reply'}
              </span>
              <p className="line-clamp-1 italic text-[11px] opacity-80">
                {message.reply_to.content}
              </p>
            </div>
          )}

          {/* Main message text */}
          <div className="whitespace-pre-wrap leading-relaxed select-text font-normal">
            {message.content}
          </div>

          {/* Timestamp & Metadata Footer */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
              isOwn ? 'text-primary-content/70' : 'text-base-content/50'
            }`}
          >
            {message.is_edited && (
              <span className="italic opacity-80">edited</span>
            )}
            <span>{formatTime(message.created_at)}</span>

            {/* Read status ticks for own messages */}
            {isOwn && (
              <span className="inline-flex items-center ml-0.5">
                {message.status === 'READ' ? (
                  <span className="flex -space-x-1 text-primary-content" title="Read">
                    <CheckIcon className="w-3 h-3" />
                    <CheckIcon className="w-3 h-3" />
                  </span>
                ) : message.status === 'DELIVERED' ? (
                  <span className="flex -space-x-1 opacity-70" title="Delivered">
                    <CheckIcon className="w-3 h-3" />
                    <CheckIcon className="w-3 h-3" />
                  </span>
                ) : (
                  <CheckIcon className="w-3 h-3 opacity-60" title="Sent" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction badges pinned below bubble */}
        {reactionEntries.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 px-1 select-none ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            {reactionEntries.map(([emoji, uids]) => {
              const hasReacted = uids.includes(currentUser?.id);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleToggleReaction(emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                    hasReacted
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs'
                      : 'bg-base-100 border-base-300 text-base-content/70 hover:border-base-300'
                  }`}
                  title={`${uids.length} reaction${uids.length > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] opacity-90 font-semibold">{uids.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
