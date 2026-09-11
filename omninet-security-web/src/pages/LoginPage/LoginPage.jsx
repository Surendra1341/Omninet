import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../theme';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Avatar,
  Fade,
  Slide
} from '@mui/material';
import {
  Email as EmailIcon,
  GitHub as GitHubIcon,
  Google as GoogleIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// LoginPage component handles authentication UI and logic
const LoginPage = () => {
  // Get query params to check for error
  const [searchParams] = useSearchParams();
  // Auth store methods
  const { login, loginWithEmail, clearError } = useAuthStore();
  // Check if error param is present
  const hasError = searchParams.get('error') === 'true';

  // Local state for email login form
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Show toast on error and clear error on unmount
  useEffect(() => {
    if (hasError) {
      toast.error('Authentication failed. Please try again.');
    }
    return () => clearError();
  }, [hasError, clearError]);

  // Handle OAuth login (GitHub/Google)
  const handleOAuthLogin = (provider) => {
    login(provider);
  };

  // Handle email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailData.email || !emailData.password) return;

    setIsLoading(true);
    try {
      await loginWithEmail(emailData);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renders the email login form with animation
  const renderEmailForm = () => (
    <Slide direction="left" in={showEmailLogin} mountOnEnter unmountOnExit>
      <Box component="form" onSubmit={handleEmailLogin} sx={{ mt: 2 }}>
        <Stack spacing={3}>
          {/* Email input */}
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={emailData.email}
            onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.3s ease',
                borderColor: theme.colors.border,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  borderColor: theme.colors.primary
                },
                '&.Mui-focused': {
                  borderColor: theme.colors.primary
                }
              },
              '& .MuiInputLabel-root': {
                color: theme.colors.fontMuted,
                fontFamily: theme.font.family,
                '&.Mui-focused': {
                  color: theme.colors.primary
                }
              }
            }}
          />

          {/* Password input */}
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={emailData.password}
            onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.3s ease',
                borderColor: theme.colors.border,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  borderColor: theme.colors.primary
                },
                '&.Mui-focused': {
                  borderColor: theme.colors.primary
                }
              },
              '& .MuiInputLabel-root': {
                color: theme.colors.fontMuted,
                fontFamily: theme.font.family,
                '&.Mui-focused': {
                  color: theme.colors.primary
                }
              }
            }}
          />

          {/* Submit button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !emailData.email || !emailData.password}
            size="large"
            sx={{
              py: 1.8,
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.colors.primary} 30%, ${theme.colors.primaryLight} 90%)`,
              boxShadow: `0 4px 20px ${theme.colors.primary}40`,
              transition: 'all 0.3s ease',
              fontFamily: theme.font.family,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${theme.colors.primary}60`,
                background: `linear-gradient(45deg, ${theme.colors.primary} 30%, ${theme.colors.primaryLight} 90%)`
              },
              '&:disabled': {
                background: theme.colors.fontMuted,
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Signing in...
              </>
            ) : (
              'Sign in with Email'
            )}
          </Button>

          {/* Back to provider options */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowEmailLogin(false)}
              color="primary"
              variant="text"
              sx={{
                borderRadius: 2,
                transition: 'all 0.3s ease',
                color: theme.colors.primary,
                fontFamily: theme.font.family,
                '&:hover': {
                  transform: 'translateX(-5px)',
                  bgcolor: `${theme.colors.primary}15`
                }
              }}
            >
              Back to other options
            </Button>
          </Box>
        </Stack>
      </Box>
    </Slide>
  );

  // Main render
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              background: theme.colors.background,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.colors.borderLight}`,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent sx={{ p: 5 }}>
              {/* Logo and welcome message */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    background: `linear-gradient(45deg, ${theme.colors.primary} 30%, ${theme.colors.primaryLight} 90%)`,
                    boxShadow: `0 8px 20px ${theme.colors.primary}40`
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 40, color: theme.colors.background }} />
                </Avatar>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.colors.primary} 30%, ${theme.colors.primaryLight} 90%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    fontFamily: theme.font.family
                  }}
                >
                  Welcome to OmniNet Security
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, color: theme.colors.fontBodyLight, fontFamily: theme.font.family }}>
                  {showEmailLogin ? 'Sign in with your email and password' : 'Sign in with your preferred provider'}
                </Typography>
              </Box>

              {/* Conditional rendering for email form or provider buttons */}
              {showEmailLogin ? (
                renderEmailForm()
              ) : (
                <Fade in={!showEmailLogin} timeout={600}>
                  <Stack spacing={3}>
                    {/* Email Login Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<EmailIcon />}
                      onClick={() => setShowEmailLogin(true)}
                      sx={{
                        py: 1.8,
                        borderRadius: 2,
                        background: `linear-gradient(45deg, ${theme.colors.primary} 30%, ${theme.colors.primaryLight} 90%)`,
                        boxShadow: `0 4px 20px ${theme.colors.primary}40`,
                        transition: 'all 0.3s ease',
                        fontFamily: theme.font.family,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${theme.colors.primary}60`
                        }
                      }}
                    >
                      Sign in with Email
                    </Button>

                    <Divider sx={{ my: 2 }}>
                      <Typography variant="body2" sx={{ px: 2, opacity: 0.7, color: theme.colors.fontMuted, fontFamily: theme.font.family }}>
                        Or continue with
                      </Typography>
                    </Divider>

                    {/* GitHub Login Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<GitHubIcon />}
                      onClick={() => handleOAuthLogin('github')}
                      sx={{
                        py: 1.8,
                        borderRadius: 2,
                        bgcolor: '#24292e',
                        boxShadow: '0 4px 20px rgba(36, 41, 46, 0.3)',
                        transition: 'all 0.3s ease',
                        fontFamily: theme.font.family,
                        '&:hover': {
                          bgcolor: '#1a1e22',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(36, 41, 46, 0.4)'
                        }
                      }}
                    >
                      Sign in with GitHub
                    </Button>

                    {/* Google Login Button */}
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      startIcon={<GoogleIcon />}
                      onClick={() => handleOAuthLogin('google')}
                      sx={{
                        py: 1.8,
                        borderRadius: 2,
                        color: theme.colors.fontBody,
                        borderColor: theme.colors.border,
                        borderWidth: 2,
                        background: theme.colors.backgroundLight,
                        transition: 'all 0.3s ease',
                        fontFamily: theme.font.family,
                        '&:hover': {
                          bgcolor: `${theme.colors.secondary}15`,
                          borderColor: theme.colors.secondary,
                          color: theme.colors.secondary,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${theme.colors.secondary}30`
                        }
                      }}
                    >
                      Sign in with Google
                    </Button>
                  </Stack>
                </Fade>
              )}

              {/* Error alert if authentication fails */}
              {hasError && (
                <Fade in timeout={300}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 3, 
                      borderRadius: 2,
                      fontFamily: theme.font.family,
                      '& .MuiAlert-icon': {
                        fontSize: 20
                      }
                    }}
                  >
                    Authentication failed. Please try again.
                  </Alert>
                </Fade>
              )}

              {/* Link to registration and terms */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, color: theme.colors.fontMuted, fontFamily: theme.font.family }}>
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    style={{ 
                      color: theme.colors.primary, 
                      textDecoration: 'none',
                      fontWeight: 500,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Sign up here
                  </Link>
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.6, color: theme.colors.fontMuted, fontFamily: theme.font.family }}>
                  By signing in, you agree to our terms of service and privacy policy.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;