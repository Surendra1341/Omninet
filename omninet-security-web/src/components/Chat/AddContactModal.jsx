import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useChatStore } from '../../store/chatStore';

const AddContactModal = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { addContact } = useChatStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addContact(email.trim());
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Add contact error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'visible'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                backdropFilter: 'blur(10px)'
              }}
            >
              <PersonAddIcon sx={{ fontSize: 28 }} />
            </Box>
            
            <Typography 
              variant="h4" 
              component="h2"
              sx={{ 
                fontWeight: 700,
                mb: 1,
                fontSize: '1.75rem'
              }}
            >
              Add New Contact
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9,
                fontSize: '1rem',
                lineHeight: 1.6
              }}
            >
              Connect with someone new by entering their email address below.
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                '& .MuiAlert-icon': {
                  color: '#dc2626'
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            disabled={loading}
            placeholder="example@domain.com"
            variant="outlined"
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '2px solid #e5e7eb',
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
              '& .MuiInputLabel-root': {
                color: '#64748b',
                fontWeight: 500,
                '&.Mui-focused': {
                  color: '#3b82f6'
                }
              },
              '& .MuiOutlinedInput-input': {
                padding: '16px 16px',
                fontSize: '1rem'
              }
            }}
          />
          
          <Box
            sx={{
              p: 3,
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              mb: 4
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748b',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                textAlign: 'center'
              }}
            >
              💡 The person will be added to your contacts and you'll be able to start chatting with them right away.
            </Typography>
          </Box>
        </Box>
        
        <Box 
          sx={{ 
            px: 4, 
            pb: 4,
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end'
          }}
        >
          <Button 
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              borderColor: '#e5e7eb',
              color: '#64748b',
              fontSize: '0.95rem',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#d1d5db',
                backgroundColor: '#f8fafc'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !email.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              backgroundColor: '#3b82f6',
              fontSize: '0.95rem',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              '&:hover': {
                backgroundColor: '#2563eb',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)'
              },
              '&:disabled': {
                backgroundColor: '#e5e7eb',
                color: '#9ca3af',
                boxShadow: 'none'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Adding...' : 'Add Contact'}
          </Button>
        </Box>
      </form>
    </Dialog>
  );
};

export default AddContactModal;