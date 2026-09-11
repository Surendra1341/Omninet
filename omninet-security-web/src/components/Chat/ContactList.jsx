import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useChatStore } from '../../store/chatStore';
import CallButtons from './CallButtons';

const ContactList = ({ onAddContact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    contacts,
    contactsLoading,
    selectedContact,
    selectContact,
    isTyping
  } = useChatStore();

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return minutes <= 0 ? 'now' : `${minutes}m`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateMessage = (message, maxLength = 35) => {
    if (!message) return '';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (contactsLoading) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <CircularProgress size={32} sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: '#ffffff'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 700,
              color: '#1e293b',
              fontSize: '1.5rem',
              letterSpacing: '-0.025em'
            }}
          >
            Messages
          </Typography>
          <IconButton 
            onClick={onAddContact}
            sx={{ 
              backgroundColor: '#3b82f6',
              color: 'white',
              width: 44,
              height: 44,
              '&:hover': {
                backgroundColor: '#2563eb',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.35)'
              },
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)'
            }}
          >
            <PersonAddIcon />
          </IconButton>
        </Box>
        
        {/* Search */}
        <TextField
          fullWidth
          size="medium"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ 
                mr: 1.5, 
                color: '#64748b',
                fontSize: '1.25rem'
              }} />
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
              },
              '&.Mui-focused': {
                backgroundColor: '#ffffff',
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              },
              '& fieldset': {
                border: 'none'
              }
            },
            '& .MuiOutlinedInput-input': {
              padding: '14px 16px',
              '&::placeholder': {
                color: '#64748b',
                opacity: 1
              }
            }
          }}
        />
      </Box>

      {/* Contacts List */}
      <Box 
        className="scroll-contacts" 
        sx={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '3px',
            '&:hover': {
              background: '#94a3b8'
            }
          }
        }}
      >
        {filteredContacts.length === 0 ? (
          <Box sx={{ 
            p: 6, 
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <PersonAddIcon sx={{ fontSize: 28, color: '#94a3b8' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
              {searchTerm ? 'No contacts found' : 'No conversations yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
              {searchTerm ? 'Try searching with a different term' : 'Start a conversation by adding a new contact'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredContacts.map((contact, index) => (
              <ListItem 
                key={contact.email} 
                disablePadding
                sx={{ 
                  borderBottom: index < filteredContacts.length - 1 ? '1px solid #f1f5f9' : 'none'
                }}
              >
                <ListItemButton
                  selected={selectedContact?.email === contact.email}
                  onClick={() => selectContact(contact)}
                  sx={{
                    py: 2,
                    px: 3,
                    '&.Mui-selected': {
                      backgroundColor: '#eff6ff',
                      borderRight: '4px solid #3b82f6',
                      '& .contact-name': {
                        color: '#1e40af'
                      }
                    },
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    },
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 'auto', mr: 2 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        contact.online ? (
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              border: '2px solid white',
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
                          width: 52, 
                          height: 52,
                          backgroundColor: '#3b82f6',
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {contact.name?.charAt(0)?.toUpperCase() || contact.email?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    disableTypography
                    sx={{ flex: 1, minWidth: 0 }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography
                          className="contact-name"
                          sx={{ 
                            fontWeight: contact.unreadCount > 0 ? 700 : 500,
                            color: '#1e293b',
                            fontSize: '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            mr: 1
                          }}
                        >
                          {contact.name || contact.email}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          {/* Call Buttons */}
                          <Box
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              opacity: selectedContact?.email === contact.email ? 1 : 0,
                              transition: 'opacity 0.2s ease-in-out',
                              '.MuiListItemButton-root:hover &': {
                                opacity: 1
                              }
                            }}
                          >
                            <CallButtons
                              contactEmail={contact.email}
                              className="flex-shrink-0"
                            />
                          </Box>
                          {contact.lastMessageTime && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#64748b',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              {formatTime(contact.lastMessageTime)}
                            </Typography>
                          )}
                          {contact.unreadCount > 0 && (
                            <Box
                              sx={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '50%',
                                minWidth: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {isTyping(contact.email) ? (
                          <Typography
                            variant="body2"
                            sx={{ 
                              color: '#3b82f6',
                              fontStyle: 'italic',
                              fontSize: '0.875rem',
                              fontWeight: 500
                            }}
                          >
                            typing...
                          </Typography>
                        ) : contact.lastMessage ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#64748b',
                              fontSize: '0.875rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: contact.unreadCount > 0 ? 500 : 400
                            }}
                          >
                            {truncateMessage(contact.lastMessage)}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#94a3b8',
                              fontSize: '0.875rem',
                              fontStyle: 'italic'
                            }}
                          >
                            No messages yet
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ContactList;