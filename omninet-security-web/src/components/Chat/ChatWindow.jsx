import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ChevronDoubleDownIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const formatDateDivider = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const ChatWindow = () => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    messagesByConversation,
    hasMoreByConversation,
    isLoadingMessages,
    loadMessages,
    sendMessage,
    setReplyingTo,
    setEditingMessage,
    deleteMessage,
    typingByConversation,
    presence,
    setIsGroupInfoOpen,
  } = useChatStore();

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = messagesByConversation[activeConversationId] || [];
  const hasMore = hasMoreByConversation[activeConversationId] || false;
  const typers = Object.values(typingByConversation[activeConversationId] || {});

  // Scroll to bottom on conversation change or new message (if user was near bottom)
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeConversationId]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 150);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-indigo-500/20');
      setTimeout(() => el.classList.remove('bg-indigo-500/20'), 1500);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/60 p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-950/50">
          <ChatBubbleLeftEllipsisIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">OmniNet Real-time Chat</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">
          Select a conversation from the sidebar or start a new direct message or group chat.
        </p>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'GROUP';
  const otherMember = !isGroup
    ? (activeConversation.members || []).find(
        (m) => m.user_id !== currentUser?.id && m.user_email !== currentUser?.email
      )
    : null;

  const headerTitle = isGroup
    ? activeConversation.name || 'Group Chat'
    : otherMember?.user_name || otherMember?.user_email || 'Direct Message';

  const isOnline = otherMember?.user_id
    ? presence[otherMember.user_id]?.status === 'ONLINE'
    : false;

  const subtitle = isGroup
    ? `${(activeConversation.members || []).length} members`
    : isOnline
    ? 'Online'
    : 'Offline';

  // Filter messages if search inside chat is active
  const displayedMessages = searchFilter.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchFilter.toLowerCase().trim())
      )
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={() => setActiveConversation(null)}
            className="md:hidden text-slate-400 hover:text-slate-200 p-1 -ml-1 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                isGroup
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                  : 'bg-gradient-to-tr from-indigo-700 to-slate-700 text-slate-100'
              }`}
            >
              {headerTitle.slice(0, 2).toUpperCase()}
            </div>
            {!isGroup && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isOnline ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-slate-500'
                }`}
              />
            )}
          </div>

          {/* Titles */}
          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-100 truncate">{headerTitle}</h3>
            <p className="text-xs truncate">
              {typers.length > 0 ? (
                <span className="text-indigo-400 font-medium italic animate-pulse">
                  {typers[0].userName} is typing...
                </span>
              ) : (
                <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                  {subtitle}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {/* In-chat search toggle */}
          <button
            type="button"
            onClick={() => setIsSearchingInChat(!isSearchingInChat)}
            className={`p-2 rounded-xl transition-colors ${
              isSearchingInChat
                ? 'bg-indigo-600/20 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Search in conversation"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          {/* Group / Contact details toggle */}
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors"
            title="View details"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* In-chat search bar */}
      {isSearchingInChat && (
        <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center gap-2 animate-slide-down">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search messages in this conversation..."
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 relative"
      >
        {/* Load older messages button */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              type="button"
              onClick={() => loadMessages(activeConversationId, true)}
              disabled={isLoadingMessages}
              className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700 transition-colors shadow-xs"
            >
              {isLoadingMessages ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center select-none">
            <p className="text-sm font-medium text-slate-400">
              {searchFilter ? 'No matching messages found' : 'No messages yet'}
            </p>
            {!searchFilter && (
              <p className="text-xs text-slate-500 mt-1">Send a message to say hello 👋</p>
            )}
          </div>
        ) : (
          displayedMessages.map((msg, idx) => {
            const prevMsg = displayedMessages[idx - 1];
            const showDateDivider =
              !prevMsg ||
              new Date(prevMsg.created_at).toDateString() !==
                new Date(msg.created_at).toDateString();

            return (
              <React.Fragment key={msg.id || idx}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="bg-slate-800/90 text-slate-400 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-700/60 shadow-xs">
                      {formatDateDivider(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isGroup={isGroup}
                  onReply={(m) => setReplyingTo(m)}
                  onEdit={(m) => setEditingMessage(m)}
                  onDelete={(id) => deleteMessage(id)}
                  onScrollToMessage={scrollToMessage}
                />
              </React.Fragment>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2 rounded-full bg-slate-800/90 text-indigo-400 border border-slate-700/80 shadow-lg hover:bg-slate-700 transition-all active:scale-95 z-20 animate-fade-in"
          title="Scroll to latest"
        >
          <ChevronDoubleDownIcon className="w-4 h-4" />
        </button>
      )}

      {/* Typing indicator */}
      <TypingIndicator typers={typers} />

      {/* Message Composer Input */}
      <MessageInput onSendMessage={(content) => sendMessage(content)} />
    </div>
  );
};

export default ChatWindow;
