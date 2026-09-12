import React, { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import ConversationList from '../../components/Chat/ConversationList';
import ChatWindow from '../../components/Chat/ChatWindow';
import NewConversationModal from '../../components/Chat/NewConversationModal';
import GroupInfoDrawer from '../../components/Chat/GroupInfoDrawer';

const Chat = () => {
  const { init, cleanup, activeConversationId } = useChatStore();

  useEffect(() => {
    let teardown;
    init().then((fn) => {
      teardown = fn;
    });

    return () => {
      if (teardown) teardown();
      cleanup();
    };
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-4.5rem)] w-full overflow-hidden bg-base-100 rounded-2xl border border-base-300 shadow-xs">
      {/* Left Sidebar: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList />
      </div>

      {/* Right Area: Active Conversation Window */}
      <div
        className={`flex-1 h-full ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatWindow />
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal />

      {/* Group Info Drawer */}
      <GroupInfoDrawer />
    </div>
  );
};

export default Chat;
