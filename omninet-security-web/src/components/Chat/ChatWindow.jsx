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

  // Scroll to bottom on conversation change or new message
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
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 1500);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base-100 p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-xs">
          <ChatBubbleLeftEllipsisIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-base-content">OmniNet Secure Chat</h3>
        <p className="text-xs text-base-content/60 max-w-sm mt-1 leading-relaxed">
          Select an ongoing conversation or start a new direct message or group conversation to communicate in real time.
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
    <div className="flex-1 flex flex-col h-full bg-base-100 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-300 bg-base-100/90 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={() => setActiveConversation(null)}
            className="md:hidden btn btn-ghost btn-xs btn-square -ml-1 text-base-content/70"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                isGroup
                  ? 'bg-secondary text-secondary-content'
                  : 'bg-primary text-primary-content'
              }`}
            >
              {headerTitle.slice(0, 2).toUpperCase()}
            </div>
            {!isGroup && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-base-100 ${
                  isOnline ? 'bg-success' : 'bg-base-content/30'
                }`}
              />
            )}
          </div>

          {/* Titles */}
          <div className="truncate">
            <h3 className="text-sm font-semibold text-base-content truncate">{headerTitle}</h3>
            <p className="text-xs truncate">
              {typers.length > 0 ? (
                <span className="text-primary font-medium italic animate-pulse">
                  {typers[0].userName} is typing...
                </span>
              ) : (
                <span className={isOnline ? 'text-success font-medium' : 'text-base-content/50'}>
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
            className={`btn btn-ghost btn-sm btn-square rounded-xl transition-colors ${
              isSearchingInChat
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
            }`}
            title="Search in conversation"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>

          {/* Group / Contact details toggle */}
          <button
            type="button"
            onClick={() => setIsGroupInfoOpen(true)}
            className="btn btn-ghost btn-sm btn-square rounded-xl text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
            title="View details"
          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-chat search bar */}
      {isSearchingInChat && (
        <div className="px-4 py-2.5 bg-base-200/90 border-b border-base-300 flex items-center gap-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-base-content/50 shrink-0" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search messages in this conversation..."
            className="flex-1 bg-transparent text-xs text-base-content placeholder:text-base-content/40 focus:outline-none"
            autoFocus
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="text-xs text-base-content/50 hover:text-base-content font-medium"
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
        className="flex-1 overflow-y-auto px-5 py-4 space-y-1 relative bg-base-200/30"
      >
        {/* Load older messages button */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              type="button"
              onClick={() => loadMessages(activeConversationId, true)}
              disabled={isLoadingMessages}
              className="btn btn-xs btn-ghost border border-base-300 text-base-content/70 rounded-full"
            >
              {isLoadingMessages ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center select-none">
            <p className="text-xs font-semibold text-base-content/60">
              {searchFilter ? 'No matching messages found' : 'No messages yet'}
            </p>
            {!searchFilter && (
              <p className="text-[11px] text-base-content/40 mt-1">Send a message to start the conversation</p>
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
                    <span className="bg-base-200 text-base-content/60 text-[11px] font-medium px-3 py-1 rounded-full border border-base-300 shadow-2xs">
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
          className="btn btn-circle btn-sm btn-outline absolute bottom-20 right-6 bg-base-100 border-base-300 shadow-md text-primary hover:bg-base-200 transition-all active:scale-95 z-20"
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
