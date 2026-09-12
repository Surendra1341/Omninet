import React, { useState } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatApi } from '../../services/chatService';

const GroupInfoDrawer = () => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    conversations,
    activeConversationId,
    isGroupInfoOpen,
    setIsGroupInfoOpen,
    presence,
    addMemberToGroup,
    removeMemberFromGroup,
  } = useChatStore();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  if (!isGroupInfoOpen || !conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const isCreator = conversation.created_by === currentUser?.id;
  const members = conversation.members || [];

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await chatApi.searchUsers(q.trim());
      // Exclude members already in group
      const existingUserIds = new Set(members.map((m) => m.user_id));
      const filtered = (results || []).filter((u) => !existingUserIds.has(u.id));
      setSearchResults(filtered);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (user) => {
    try {
      const member = {
        user_id: user.id,
        user_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email,
        user_email: user.email,
        user_avatar: user.avatarUrl || '',
      };
      await addMemberToGroup(conversation.id, member);
      setIsAddingMember(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMemberFromGroup(conversation.id, userId);
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col animate-slide-left select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="text-base font-bold text-slate-100">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          type="button"
          onClick={() => setIsGroupInfoOpen(false)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-lg mb-3">
            {conversation.name ? conversation.name.slice(0, 2).toUpperCase() : 'Chat'}
          </div>
          <h4 className="text-base font-bold text-slate-100">{conversation.name || 'Direct Message'}</h4>
          <span className="text-xs text-slate-400 mt-1">
            {isGroup ? `${members.length} members` : 'Direct Conversation'}
          </span>
        </div>

        {/* Members section for Group */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Members ({members.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <UserPlusIcon className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Add Member inline search */}
            {isAddingMember && (
              <div className="mb-3 p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search user to add..."
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {isSearching ? (
                  <p className="text-[11px] text-slate-400 text-center py-1">Searching...</p>
                ) : (
                  searchResults.length > 0 && (
                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-700/40">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleAddMember(u)}
                          className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-700/50 rounded cursor-pointer"
                        >
                          <div className="truncate">
                            <p className="text-xs font-medium text-slate-200 truncate">
                              {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                          </div>
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-semibold">
                            Add
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Members List */}
            <div className="divide-y divide-slate-800/60 space-y-1">
              {members.map((member) => {
                const isOnline = presence[member.user_id]?.status === 'ONLINE';
                const isUserCreator = member.user_id === conversation.created_by;
                const isSelf = member.user_id === currentUser?.id;

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between py-2 px-1 hover:bg-slate-800/40 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs">
                          {member.user_name ? member.user_name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {member.user_name || member.user_email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-slate-400 italic">(you)</span>
                          )}
                          {isUserCreator && (
                            <ShieldCheckIcon
                              className="w-3.5 h-3.5 text-amber-400 shrink-0"
                              title="Group Admin"
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {member.user_email}
                        </span>
                      </div>
                    </div>

                    {/* Remove member button for admin */}
                    {isCreator && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove member"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfoDrawer;
