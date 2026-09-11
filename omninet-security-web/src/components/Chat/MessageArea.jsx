import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useChatStore } from '../../store/chatStore';

const MessageArea = ({ contact, currentUserEmail }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const {
    getMessagesForContact,
    messagesLoading,
    isTyping
  } = useChatStore();

  const messages = getMessagesForContact(contact?.email);

  // Helper to scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior });
      } catch (_) {
        // silent
      }
    }
  }, []);

  // Track user scroll position to decide auto-scroll behavior
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 120; // px from bottom considered "at bottom"
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = distanceFromBottom < threshold;
      setAutoScroll(nearBottom);
      setShowScrollButton(!nearBottom && messages.length > 0);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  // When messages change, scroll if user is at/near bottom or message authored by self
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const isOwn = last.senderEmail === currentUserEmail;
    if (autoScroll || isOwn) {
      scrollToBottom(messages.length < 10 ? 'auto' : 'smooth');
    }
  }, [messages, autoScroll, currentUserEmail, scrollToBottom]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const previousDate = new Date(previousMsg.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const getMessageStatus = (message) => {
    switch (message.status) {
      case 'PENDING':
        return <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
      case 'DELIVERED':
        return <CheckIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
      case 'READ':
        return <DoneAllIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
      default:
        return null;
    }
  };

  const MessageBubble = ({ message, isOwn, showAvatar }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 2,
        px: 3,
        animation: `${isOwn ? 'messageInRight' : 'messageInLeft'} 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        '@keyframes messageInRight': {
          '0%': { opacity: 0, transform: 'translateY(10px) translateX(20px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) translateX(0) scale(1)' }
        },
        '@keyframes messageInLeft': {
          '0%': { opacity: 0, transform: 'translateY(10px) translateX(-20px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) translateX(0) scale(1)' }
        }
      }}
    >
      {!isOwn && showAvatar && (
        <Avatar
          src={contact?.avatarUrl}
          alt={contact?.name}
          sx={{ 
            width: 36, 
            height: 36, 
            mr: 2, 
            mt: 'auto',
            backgroundColor: '#3b82f6',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
          }}
        >
          {(contact?.name || contact?.email)?.charAt(0)?.toUpperCase()}
        </Avatar>
      )}
      
      {!isOwn && !showAvatar && (
        <Box sx={{ width: 36, mr: 2 }} />
      )}
      
      <Box
        sx={{
          maxWidth: '75%',
          px: 3,
          py: 2,
          backgroundColor: isOwn ? '#3b82f6' : '#ffffff',
          color: isOwn ? 'white' : '#374151',
          borderRadius: '20px',
          borderTopRightRadius: isOwn ? '6px' : '20px',
          borderTopLeftRadius: isOwn ? '20px' : '6px',
          position: 'relative',
          boxShadow: isOwn 
            ? '0 4px 16px rgba(59, 130, 246, 0.25), 0 1px 4px rgba(59, 130, 246, 0.1)' 
            : '0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: isOwn 
              ? '0 6px 20px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(59, 130, 246, 0.15)'
              : '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <Typography 
          variant="body1" 
          component="div"
          sx={{
            fontSize: '0.95rem',
            lineHeight: 1.5,
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
            mt: 1
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isOwn ? 'rgba(255,255,255,0.85)' : '#64748b',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            {formatTime(message.timestamp)}
          </Typography>
          
          {isOwn && getMessageStatus(message)}
        </Box>
      </Box>
    </Box>
  );

  const TypingIndicator = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        mb: 2,
        px: 3,
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <Avatar
        src={contact?.avatarUrl}
        alt={contact?.name}
        sx={{ 
          width: 36, 
          height: 36, 
          mr: 2, 
          mt: 'auto',
          backgroundColor: '#3b82f6',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
        }}
      >
        {(contact?.name || contact?.email)?.charAt(0)?.toUpperCase()}
      </Avatar>
      
      <Box
        sx={{
          px: 3,
          py: 2,
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          borderTopLeftRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
          minWidth: '80px'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          typing
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                animation: 'typing 1.4s infinite ease-in-out',
                animationDelay: `${i * 0.16}s`,
                '@keyframes typing': {
                  '0%, 80%, 100%': {
                    opacity: 0.3,
                    transform: 'scale(0.8)'
                  },
                  '40%': {
                    opacity: 1,
                    transform: 'scale(1.1)'
                  }
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );

  const DateSeparator = ({ date }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', my: 3, px: 3 }}>
      <Divider sx={{ flex: 1, borderColor: '#e5e7eb' }} />
      <Typography
        variant="caption"
        sx={{
          mx: 3,
          px: 3,
          py: 1,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          color: '#64748b',
          fontSize: '0.75rem',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f1f5f9'
        }}
      >
        {formatDate(date)}
      </Typography>
      <Divider sx={{ flex: 1, borderColor: '#e5e7eb' }} />
    </Box>
  );

  if (!contact) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#fafafa',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)'
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)'
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontSize: '2rem', color: 'white' }}>💬</Typography>
          </Box>
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            color: '#374151', 
            mb: 2,
            textAlign: 'center'
          }}
        >
          Welcome to Messages
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#64748b', 
            textAlign: 'center',
            maxWidth: 400,
            lineHeight: 1.6
          }}
        >
          Select a conversation from the sidebar to start messaging, or create a new conversation by adding a contact.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        backgroundColor: '#ffffff'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            contact.online ? (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '3px solid white',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                }}
              />
            ) : null
          }
        >
          <Avatar
            src={contact.avatarUrl}
            alt={contact.name}
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 3,
              backgroundColor: '#3b82f6',
              fontSize: '1.25rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
          >
            {(contact.name || contact.email)?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Badge>
        
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              fontWeight: 600,
              color: '#1e293b',
              fontSize: '1.125rem',
              mb: 0.5
            }}
          >
            {contact.name || contact.email}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: contact.online ? '#10b981' : '#94a3b8'
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: contact.online ? '#10b981' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {contact.online ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        className="scroll-messages"
        sx={{
          flex: 1,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          backgroundColor: '#fafafa',
          backgroundImage: 'linear-gradient(145deg, #fafafa 0%, #f8fafc 50%, #ffffff 100%)',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
            borderRadius: '4px',
            '&:hover': {
              background: 'linear-gradient(135deg, #94a3b8, #64748b)'
            }
          }
        }}
      >
        {messagesLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}
          >
            <CircularProgress size={32} sx={{ color: '#3b82f6' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              px: 4
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <Typography sx={{ fontSize: '2rem' }}>👋</Typography>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#374151', 
                mb: 2, 
                textAlign: 'center' 
              }}
            >
              Start your conversation
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748b', 
                textAlign: 'center',
                lineHeight: 1.6,
                maxWidth: 300
              }}
            >
              Send a message to {contact.name || contact.email} to begin your conversation
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderEmail === currentUserEmail;
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
              
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const showAvatar = !isOwn && (!nextMessage || nextMessage.senderEmail !== message.senderEmail);

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <DateSeparator date={message.timestamp} />
                  )}
                  <Box className={isOwn ? 'msg-enter-right' : 'msg-enter-left'}>
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                    />
                  </Box>
                </React.Fragment>
              );
            })}
            
            {isTyping(contact.email) && <TypingIndicator />}
          </>
        )}
        
        <div ref={messagesEndRef} />
        {showScrollButton && (
          <Box
            onClick={() => scrollToBottom('smooth')}
            sx={{
              position: 'sticky',
              bottom: 16,
              alignSelf: 'center',
              backgroundColor: '#3b82f6',
              color: 'white',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
              px: 3,
              py: 1.5,
              borderRadius: '24px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': { 
                backgroundColor: '#2563eb',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)'
              },
              zIndex: 10
            }}
          >
            ↓ New messages
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageArea;