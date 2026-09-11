import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback, setError } = useAuthStore();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Check for OAuth tokens in URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Handle successful OAuth callback
          await handleOAuthCallback(searchParams);
          navigate('/home', { replace: true });
        } else {
          // Check for error parameters
          const error = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (error) {
            console.error('OAuth error:', error, errorDescription);
            setError(errorDescription || 'OAuth authentication failed');
            toast.error('Authentication failed. Please try again.');
            navigate('/login', { replace: true });
          } else {
            // No tokens and no error - invalid callback
            setError('Invalid authentication callback');
            toast.error('Invalid authentication callback');
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('OAuth callback processing error:', error);
        setError(error.message || 'Authentication failed');
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    processOAuthCallback();
  }, [searchParams, handleOAuthCallback, setError, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Processing authentication...
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthCallbackPage;
