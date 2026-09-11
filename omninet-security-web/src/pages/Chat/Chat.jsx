import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import ContactList from '../../components/Chat/ContactList';
import MessageArea from '../../components/Chat/MessageArea';
import MessageComposer from '../../components/Chat/MessageComposer';
import AddContactModal from '../../components/Chat/AddContactModal';
import CallModal from '../../components/Chat/CallModal';

function Chat() {
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  
  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { user } = useAuthStore();
  const {
    connected,
    connecting,
    error,
    selectedContact,
    connect,
    disconnect,
    loadContacts,
    reset,
    setCurrentUserEmail,
    selectContact
  } = useChatStore();

  // Show connection success toast
  useEffect(() => {
    if (connected && !connectionError) {
      setShowConnectionToast(true);
      const timer = setTimeout(() => setShowConnectionToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connected, connectionError]);

  // Initialize chat when component mounts
  useEffect(() => {
    if (user?.email) {
      // Set current user email in chat store
      setCurrentUserEmail(user.email);
      
      const initializeChat = async () => {
        try {
          // Load contacts first
          await loadContacts();

          // Auto-select first contact if none selected
          const state = useChatStore.getState();
            if (!state.selectedContact && state.contacts.length > 0) {
              // Select first contact which triggers history load
              state.selectContact(state.contacts[0]);
            }

          // Then connect to WebSocket (after potential selection)
          await connect();
        } catch (error) {
          console.error('Failed to initialize chat:', error);
          setConnectionError('Failed to connect to chat service');
        }
      };

      initializeChat();
    }

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [user?.email, setCurrentUserEmail]);

  // Handle connection errors
  useEffect(() => {
    if (error) {
      setConnectionError(error);
    }
  }, [error]);

  const handleRetryConnection = async () => {
    setConnectionError(null);
    try {
      await connect();
    } catch (error) {
      console.error('Retry connection failed:', error);
    }
  };

  const handleAddContact = () => {
    setAddContactOpen(true);
  };

  const handleCloseAddContact = () => {
    setAddContactOpen(false);
  };

  const handleBackToContacts = () => {
    selectContact(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0 animate-pulse"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col min-h-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 font-inter transition-all duration-300">
      {/* Connection Status Bar */}
      <div className={`transform transition-all duration-500 ease-out ${(connecting || connectionError) ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className={`${connectionError ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-900 border-blue-200'} border-b px-6 py-4 flex items-center justify-between backdrop-blur-sm shadow-sm`}>
          <div className="flex items-center animate-fade-in">
            <div className={`w-5 h-5 mr-3 ${connectionError ? 'text-red-500' : 'text-blue-500'} animate-pulse`}>
              {connectionError ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
                </svg>
              )}
            </div>
            <span className="text-sm font-semibold">
              {connectionError ? (
                `Connection failed: ${connectionError}`
              ) : (
                'Connecting to chat service...'
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {connectionError && (
              <button
                onClick={handleRetryConnection}
                className="p-2 hover:bg-red-200/50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Retry connection"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setConnectionError(null)}
              className={`p-2 ${connectionError ? 'hover:bg-red-200/50' : 'hover:bg-blue-200/50'} rounded-lg transition-all duration-200 hover:scale-105 active:scale-95`}
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 overflow-hidden min-h-0 p-2 md:p-4">
        <div className="h-full flex max-w-7xl mx-auto bg-white/70 backdrop-blur-xl md:rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-white/20 transition-all duration-300 hover:shadow-3xl">
          {/* Contacts Sidebar */}
          <div className={`${selectedContact && isMobile ? 'hidden' : 'flex'} md:flex w-full md:w-96 border-r border-slate-200/50 flex-col min-h-0 bg-gradient-to-b from-white/80 to-slate-50/80 backdrop-blur-sm transition-all duration-300`}>
            <ContactList onAddContact={handleAddContact} />
          </div>

          {/* Chat Area */}
          <div className={`${selectedContact || !isMobile ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-h-0 bg-gradient-to-b from-slate-50/50 to-white/50 backdrop-blur-sm relative transition-all duration-300`}>
            {/* Back button for mobile */}
            {isMobile && selectedContact && (
              <button
                onClick={handleBackToContacts}
                className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-white/30 hover:bg-white hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-slate-700 group-hover:text-slate-900 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden min-h-0 relative">
              <MessageArea
                contact={selectedContact}
                currentUserEmail={user.email}
              />
            </div>

            {/* Message Composer */}
            {selectedContact && (
              <div className="border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
                <MessageComposer
                  contact={selectedContact}
                  disabled={!connected}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        open={addContactOpen}
        onClose={handleCloseAddContact}
      />

      {/* WebRTC Call Modal */}
      <CallModal />

      {/* Connection Status Toast */}
      <div className={`fixed bottom-6 left-6 transform transition-all duration-500 ease-out ${showConnectionToast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg border border-emerald-400/30 backdrop-blur-sm flex items-center space-x-3 animate-bounce-in">
          <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"></div>
          <span className="font-medium text-sm">Connected to chat service</span>
        </div>
      </div>

      {/* Custom Animations Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          50% { transform: translateY(-5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}

export default Chat;

