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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-slate-100">
            {activeTab === 'DM' ? 'New Message' : 'New Group Chat'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('DM');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'DM'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
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
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'GROUP'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>Group Chat</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Group Name input if GROUP */}
          {activeTab === 'GROUP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Engineering Team, Weekend Trip"
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />

              {/* Selected member chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedMembers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 bg-indigo-900/60 border border-indigo-500/50 text-indigo-200 text-xs px-2.5 py-1 rounded-full"
                    >
                      <span>{m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.email}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMemberForGroup(m)}
                        className="hover:text-white"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Search by name or email
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to find users..."
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-slate-400">Searching users...</div>
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
                        ? 'bg-indigo-600/20 border border-indigo-500/50'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-slate-200 truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>

                    {activeTab === 'GROUP' && (
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                );
              })
            ) : searchQuery.length >= 2 ? (
              <div className="p-4 text-center text-xs text-slate-500">No users found</div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer (for Group creation) */}
        {activeTab === 'GROUP' && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isSubmitting || selectedMembers.length === 0 || !groupName.trim()}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all shadow-md ${
                !isSubmitting && selectedMembers.length > 0 && groupName.trim()
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
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
