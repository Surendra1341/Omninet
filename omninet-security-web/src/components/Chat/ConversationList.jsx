import React, { useMemo } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

const formatConversationTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const isThisYear = d.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
  } catch {
    return '';
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const ConversationList = () => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    setIsNewConvModalOpen,
    presence,
    typingByConversation,
    connectionStatus,
  } = useChatStore();

  // Helper to extract DM title and presence
  const getConversationDetails = (conv) => {
    if (conv.type === 'GROUP') {
      return {
        title: conv.name || 'Group Chat',
        avatar: conv.avatar_url,
        isOnline: false,
        isGroup: true,
      };
    }

    // For DM, find other member
    const otherMember = (conv.members || []).find(
      (m) => m.user_id !== currentUser?.id && m.user_email !== currentUser?.email
    );

    const title = otherMember?.user_name || otherMember?.user_email || conv.name || 'Direct Message';
    const isOnline = otherMember?.user_id ? presence[otherMember.user_id]?.status === 'ONLINE' : false;

    return {
      title,
      avatar: otherMember?.user_avatar,
      isOnline,
      isGroup: false,
      otherMember,
    };
  };

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const details = getConversationDetails(c);
      return (
        details.title.toLowerCase().includes(q) ||
        (c.last_message?.content && c.last_message.content.toLowerCase().includes(q))
      );
    });
  }, [conversations, searchQuery, currentUser, presence]);

  return (
    <div className="flex flex-col h-full bg-base-100 border-r border-base-300 w-full select-none">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-base-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-base-content tracking-tight">
              Chats
            </h2>
            {/* Connection status indicator */}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                connectionStatus === 'connected'
                  ? 'bg-success'
                  : connectionStatus === 'connecting'
                  ? 'bg-warning animate-pulse'
                  : 'bg-error'
              }`}
              title={`Status: ${connectionStatus}`}
            />
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => setIsNewConvModalOpen(true)}
            className="btn btn-primary btn-xs rounded-xl font-medium gap-1"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-2" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="input input-bordered input-xs w-full bg-base-200/50 text-base-content rounded-xl pl-8 placeholder:text-base-content/40 focus:border-primary"
          />
        </div>
      </div>

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-2">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-base-content">No conversations yet</p>
            <p className="text-[11px] text-base-content/50 mt-1 max-w-xs">
              Start a new chat or create a group to begin messaging
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const details = getConversationDetails(conv);
            const typers = Object.values(typingByConversation[conv.id] || {});
            const isTyping = typers.length > 0;
            const lastMsg = conv.last_message;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30 shadow-xs'
                    : 'hover:bg-base-200/60 border border-transparent'
                }`}
              >
                {/* Avatar with presence dot */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                      details.isGroup
                        ? 'bg-primary/15 text-primary'
                        : 'bg-base-200 text-base-content'
                    }`}
                  >
                    {details.avatar ? (
                      <img
                        src={details.avatar}
                        alt={details.title}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : details.isGroup ? (
                      <UserGroupIcon className="w-5 h-5 text-primary" />
                    ) : (
                      getInitials(details.title)
                    )}
                  </div>

                  {/* Online dot for DM */}
                  {!details.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-base-100 ${
                        details.isOnline ? 'bg-success' : 'bg-base-300'
                      }`}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-primary' : 'text-base-content'
                        }`}
                      >
                        {details.title}
                      </span>
                      {details.isGroup && (
                        <span className="badge badge-xs badge-neutral font-medium">
                          Group
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-base-content/40 shrink-0 ml-2">
                      {formatConversationTime(lastMsg?.created_at || conv.updated_at)}
                    </span>
                  </div>

                  {/* Preview or Typing text */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-base-content/60 truncate">
                      {isTyping ? (
                        <span className="text-primary font-medium italic animate-pulse">
                          {typers[0].userName} is typing...
                        </span>
                      ) : lastMsg?.content ? (
                        <span>
                          {lastMsg.sender_id === currentUser?.id ? 'You: ' : ''}
                          {lastMsg.content}
                        </span>
                      ) : (
                        <span className="italic opacity-50">No messages yet</span>
                      )}
                    </p>

                    {/* Unread badge */}
                    {conv.unread_count > 0 && (
                      <span className="badge badge-primary badge-xs font-bold shrink-0">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
