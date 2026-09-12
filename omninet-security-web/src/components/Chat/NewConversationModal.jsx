import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UserGroupIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { chatApi } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

const NewConversationModal = () => {
  const { isNewConvModalOpen, setIsNewConvModalOpen, createConversation } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState('DM'); // 'DM' | 'GROUP'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Debounced search for users
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await chatApi.searchUsers(searchQuery.trim());
        // Filter out self
        const filtered = (results || []).filter(
          (u) => u.id !== currentUser?.id && u.email !== currentUser?.email
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  if (!isNewConvModalOpen) return null;

  const handleClose = () => {
    setIsNewConvModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMembers([]);
    setGroupName('');
    setErrorMsg('');
  };

  const handleSelectUserForDM = async (user) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;
      const member = {
        user_id: user.id,
        user_name: displayName,
        user_email: user.email,
        user_avatar: user.avatarUrl || '',
      };

      await createConversation({
        type: 'DM',
        members: [member],
      });

      handleClose();
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to start conversation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMemberForGroup = (user) => {
    if (selectedMembers.some((m) => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorMsg('Please enter a group name');
      return;
    }
    if (selectedMembers.length === 0) {
      setErrorMsg('Please select at least one member');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const members = selectedMembers.map((u) => ({
        user_id: u.id,
        user_name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email,
        user_email: u.email,
        user_avatar: u.avatarUrl || '',
      }));

      await createConversation({
        type: 'GROUP',
        name: groupName.trim(),
        members,
      });

      handleClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 bg-base-100">
          <h3 className="text-sm font-semibold text-base-content">
            {activeTab === 'DM' ? 'New Message' : 'New Group Chat'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-base-300 bg-base-200/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('DM');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'DM'
                ? 'bg-base-100 text-primary shadow-xs border border-base-300/50'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Direct Message</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('GROUP');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'GROUP'
                ? 'bg-base-100 text-primary shadow-xs border border-base-300/50'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>Group Chat</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-medium">
              {errorMsg}
            </div>
          )}

          {/* Group Name input if GROUP */}
          {activeTab === 'GROUP' && (
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Security Ops, Core Team"
                className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
              />

              {/* Selected member chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {selectedMembers.map((m) => (
                    <span
                      key={m.id}
                      className="badge badge-primary gap-1 py-2 px-2.5 text-xs font-medium"
                    >
                      <span>{m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.email}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMemberForGroup(m)}
                        className="hover:opacity-80"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Input */}
          <div>
            <label className="block text-xs font-semibold text-base-content/80 mb-1.5">
              Search by name or email
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name or email..."
                className="input input-bordered input-sm w-full pl-9 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-base-content/50">Searching users...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isSelected = selectedMembers.some((m) => m.id === user.id);
                const displayName =
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (activeTab === 'DM') {
                        handleSelectUserForDM(user);
                      } else {
                        handleToggleMemberForGroup(user);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-base-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-base-content truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-base-content/50 truncate">{user.email}</div>
                      </div>
                    </div>

                    {activeTab === 'GROUP' && (
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-content'
                            : 'border-base-300'
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                );
              })
            ) : searchQuery.length >= 2 ? (
              <div className="p-4 text-center text-xs text-base-content/40">No users found</div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer (for Group creation) */}
        {activeTab === 'GROUP' && (
          <div className="px-5 py-3 border-t border-base-300 bg-base-200/50 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost btn-sm text-base-content/70 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isSubmitting || selectedMembers.length === 0 || !groupName.trim()}
              className="btn btn-primary btn-sm rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Creating...' : `Create Group (${selectedMembers.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConversationModal;
