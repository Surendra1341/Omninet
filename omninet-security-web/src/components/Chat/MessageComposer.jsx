import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Divider,
  Typography
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useChatStore } from '../../store/chatStore';

const MessageComposer = ({ contact, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { sendMessage, sendTyping } = useChatStore();

  const handleSendMessage = async () => {
    if (!message.trim() || !contact || disabled) return;

    try {
      await sendMessage(contact.email, message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (typing) {
        sendTyping(contact.email, false);
        setTyping(false);
      }
      
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setMessage(value);

    if (!contact || disabled) return;

    // Handle typing indicator
    if (value.trim() && !typing) {
      setTyping(true);
      sendTyping(contact.email, true);
    } else if (!value.trim() && typing) {
      setTyping(false);
      sendTyping(contact.email, false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (typing) {
          setTyping(false);
          sendTyping(contact.email, false);
        }
      }, 2000);
    }
  };

  // Clean up typing indicator on unmount or contact change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typing && contact) {
        sendTyping(contact.email, false);
      }
    };
  }, [contact?.email]);

  // Stop typing when component unmounts
  useEffect(() => {
    return () => {
      if (typing && contact) {
        sendTyping(contact.email, false);
      }
    };
  }, []);

  if (!contact) {
    return null;
  }

  return (
    <Box
      sx={{
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#ffffff',
        p: 3,
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {/* Message Input */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={disabled ? 'Connecting...' : `Message ${contact.name || contact.email}...`}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: '#f8fafc',
                border: '2px solid #e5e7eb',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  borderColor: '#d1d5db'
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)'
                },
                '& fieldset': {
                  border: 'none'
                }
              },
              '& .MuiOutlinedInput-input': {
                py: 2,
                px: 3,
                '&::placeholder': {
                  color: '#9ca3af',
                  opacity: 1
                }
              }
            }}
          />
          
          {/* Typing indicator text */}
          {typing && (
            <Box 
              sx={{ 
                position: 'absolute',
                bottom: -24,
                left: 16,
                fontSize: '0.75rem',
                color: '#3b82f6',
                fontStyle: 'italic',
                fontWeight: 500
              }}
            >
              typing...
            </Box>
          )}
        </Box>

        {/* Send Button */}
        <Box
          onClick={handleSendMessage}
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: message.trim() && !disabled ? '#3b82f6' : '#e5e7eb',
            color: message.trim() && !disabled ? 'white' : '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: message.trim() && !disabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: message.trim() && !disabled 
              ? '0 4px 16px rgba(59, 130, 246, 0.4)' 
              : 'none',
            transform: message.trim() && !disabled ? 'scale(1)' : 'scale(0.95)',
            '&:hover': message.trim() && !disabled ? {
              backgroundColor: '#2563eb',
              transform: 'scale(1.05) translateY(-2px)',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)'
            } : {},
            '&:active': message.trim() && !disabled ? {
              transform: 'scale(0.98)'
            } : {}
          }}
        >
          <SendIcon sx={{ fontSize: '1.25rem' }} />
        </Box>
      </Box>
    </Box>
  );
};

export default MessageComposer;