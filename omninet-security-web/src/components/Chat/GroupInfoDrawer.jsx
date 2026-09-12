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
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-base-100 border-l border-base-300 shadow-2xl flex flex-col animate-slide-left select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
        <h3 className="text-sm font-semibold text-base-content">
          {isGroup ? 'Group Information' : 'Contact Details'}
        </h3>
        <button
          type="button"
          onClick={() => setIsGroupInfoOpen(false)}
          className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-base-200/50 border border-base-300 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-lg font-bold shadow-xs mb-3">
            {conversation.name ? conversation.name.slice(0, 2).toUpperCase() : 'DM'}
          </div>
          <h4 className="text-sm font-semibold text-base-content">{conversation.name || 'Direct Message'}</h4>
          <span className="text-xs text-base-content/50 mt-0.5">
            {isGroup ? `${members.length} members` : 'Direct Conversation'}
          </span>
        </div>

        {/* Members section for Group */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                Members ({members.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="btn btn-ghost btn-xs text-primary font-medium flex items-center gap-1"
              >
                <UserPlusIcon className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Add Member inline search */}
            {isAddingMember && (
              <div className="mb-3 p-3 bg-base-200/70 border border-base-300 rounded-xl space-y-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search user to add..."
                    className="input input-bordered input-xs w-full pl-8 bg-base-100 border-base-300 rounded-lg text-base-content placeholder:text-base-content/40 focus:border-primary"
                  />
                </div>
                {isSearching ? (
                  <p className="text-[11px] text-base-content/50 text-center py-1">Searching...</p>
                ) : (
                  searchResults.length > 0 && (
                    <div className="max-h-36 overflow-y-auto divide-y divide-base-300">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleAddMember(u)}
                          className="flex items-center justify-between py-1.5 px-2 hover:bg-base-100 rounded-lg cursor-pointer"
                        >
                          <div className="truncate">
                            <p className="text-xs font-medium text-base-content truncate">
                              {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                            </p>
                            <p className="text-[10px] text-base-content/50 truncate">{u.email}</p>
                          </div>
                          <span className="badge badge-primary badge-xs py-1 px-2 font-medium">
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
            <div className="divide-y divide-base-300">
              {members.map((member) => {
                const isOnline = presence[member.user_id]?.status === 'ONLINE';
                const isUserCreator = member.user_id === conversation.created_by;
                const isSelf = member.user_id === currentUser?.id;

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between py-2 px-1 hover:bg-base-200/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-base-200 border border-base-300 text-base-content flex items-center justify-center font-semibold text-xs">
                          {member.user_name ? member.user_name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-base-100 ${
                            isOnline ? 'bg-success' : 'bg-base-content/30'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-base-content truncate">
                            {member.user_name || member.user_email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-base-content/40 italic">(you)</span>
                          )}
                          {isUserCreator && (
                            <ShieldCheckIcon
                              className="w-3.5 h-3.5 text-primary shrink-0"
                              title="Group Admin"
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-base-content/50 block truncate">
                          {member.user_email}
                        </span>
                      </div>
                    </div>

                    {/* Remove member button for admin */}
                    {isCreator && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error transition-colors"
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
