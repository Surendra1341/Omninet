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
    <div className="flex flex-col h-full bg-slate-900/95 border-r border-slate-800 w-full select-none">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Chats
            </h2>
            {/* Connection status indicator */}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
              title={`Status: ${connectionStatus}`}
            />
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => setIsNewConvModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-2">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">No conversations yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
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
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 border border-indigo-500/40 shadow-sm'
                    : 'hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Avatar with presence dot */}
                <div className="relative shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shadow-inner ${
                      details.isGroup
                        ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white'
                        : 'bg-gradient-to-tr from-slate-700 to-slate-600 text-slate-200'
                    }`}
                  >
                    {details.avatar ? (
                      <img
                        src={details.avatar}
                        alt={details.title}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : details.isGroup ? (
                      <UserGroupIcon className="w-5 h-5 text-indigo-200" />
                    ) : (
                      getInitials(details.title)
                    )}
                  </div>

                  {/* Online dot for DM */}
                  {!details.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        details.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-indigo-200' : 'text-slate-200'
                        }`}
                      >
                        {details.title}
                      </span>
                      {details.isGroup && (
                        <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded font-medium border border-purple-700/40">
                          Group
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {formatConversationTime(lastMsg?.created_at || conv.updated_at)}
                    </span>
                  </div>

                  {/* Preview or Typing text */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 truncate">
                      {isTyping ? (
                        <span className="text-indigo-400 font-medium italic animate-pulse">
                          {typers[0].userName} is typing...
                        </span>
                      ) : lastMsg?.content ? (
                        <span>
                          {lastMsg.sender_id === currentUser?.id ? 'You: ' : ''}
                          {lastMsg.content}
                        </span>
                      ) : (
                        <span className="italic opacity-60">No messages yet</span>
                      )}
                    </p>

                    {/* Unread badge */}
                    {conv.unread_count > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center shrink-0 shadow-sm shadow-indigo-600/50">
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
