import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../theme';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Stack,
  Card,
  CardContent,
  Avatar,
  Fade,
  Slide,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

const EmailRegistrationPage = () => {
  const navigate = useNavigate();
  const {
    initiateEmailRegistration,
    verifyEmailOtp,
    completeEmailRegistration,
    resendOtp,
    checkEmail,
    error,
    clearError
  } = useAuthStore();

  const [step, setStep] = useState('initial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    email: '',
    name: '',
    otpCode: '',
    password: '',
    confirmPassword: '',
    verificationToken: ''
  });

  const steps = ['Account Details', 'Email Verification', 'Set Password'];
  const activeStep = step === 'initial' ? 0 : step === 'otp' ? 1 : 2;

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!data.email || !data.name) return;

    setIsSubmitting(true);
    clearError();

    try {
      // Check if email exists
      const emailCheck = await checkEmail(data.email);

      // If email is not available (already exists with password), they should login instead
      if (!emailCheck.available) {
        toast.error('An account with this email already exists. Please try logging in instead.');
        setIsSubmitting(false);
        return;
      }

      // Initiate registration (this will work for both new users and OAuth users)
      const response = await initiateEmailRegistration({
        email: data.email,
        name: data.name
      });

      if (response.success) {
        toast.success('OTP sent to your email. Please check your inbox.');
        setStep('otp');
      }
    } catch (error) {
      console.error('Registration initiation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to start registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!data.otpCode) return;

    setIsSubmitting(true);
    clearError();

    try {
      const response = await verifyEmailOtp({
        email: data.email,
        otpCode: data.otpCode
      });

      if (response.success) {
        setData(prev => ({
          ...prev,
          verificationToken: response.verificationToken
        }));

        setStep('password');
        toast.success('OTP verified successfully!');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);

      let errorMessage = 'Invalid OTP code';

      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }

      // Show specific error messages for common issues
      if (error.response?.status === 400) {
        if (errorMessage.toLowerCase().includes('expired')) {
          errorMessage = 'Your verification code has expired. Please request a new one.';
        } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('incorrect')) {
          errorMessage = 'Invalid verification code. Please check and try again.';
        } else if (errorMessage.toLowerCase().includes('attempts')) {
          errorMessage = 'Too many failed attempts. Please request a new verification code.';
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!data.password || !data.confirmPassword) return;

    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (data.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await completeEmailRegistration({
        email: data.email,
        name: data.name,
        password: data.password,
        verificationToken: data.verificationToken
      });

      if (response.success) {
        if (response.merged) {
          toast.success(`Account merged successfully! You can now sign in with email or ${response.mergedProviders}.`);
        } else {
          toast.success('Registration completed successfully! Please sign in with your credentials.');
        }
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration completion failed:', error);
      toast.error(error.response?.data?.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp(data.email);
      toast.success('OTP resent to your email');
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
  };

  const renderInitialForm = () => (
    <Slide direction="right" in={step === 'initial'} mountOnEnter unmountOnExit>
      <Box component="form" onSubmit={handleInitialSubmit} sx={{ mt: 2 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={data.email}
            onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
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

          <TextField
            fullWidth
            id="name"
            name="name"
            label="Full name"
            type="text"
            autoComplete="name"
            required
            value={data.name}
            onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || !data.email || !data.name}
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
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Sending OTP...
              </>
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </Stack>
      </Box>
    </Slide>
  );

  const renderOtpForm = () => (
    <Slide direction="left" in={step === 'otp'} mountOnEnter unmountOnExit>
      <Box component="form" onSubmit={handleOtpSubmit} sx={{ mt: 2 }}>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: `${theme.colors.primary}15`,
              border: `1px solid ${theme.colors.primary}30`
            }}
          >
            <Typography variant="body2" sx={{ textAlign: 'center', color: theme.colors.fontMuted, fontFamily: theme.font.family }}>
              We've sent a 6-digit verification code to
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ textAlign: 'center', mt: 0.5, color: theme.colors.fontBody, fontFamily: theme.font.family }}>
              {data.email}
            </Typography>
          </Paper>

          <TextField
            fullWidth
            id="otpCode"
            name="otpCode"
            label="Verification Code"
            type="text"
            inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' } }}
            required
            value={data.otpCode}
            onChange={(e) => setData(prev => ({ ...prev, otpCode: e.target.value.replace(/\D/g, '') }))}
            variant="outlined"
            placeholder="000000"
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || data.otpCode.length !== 6}
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
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              onClick={handleResendOtp}
              color="primary"
              variant="text"
              sx={{
                borderRadius: 2,
                transition: 'all 0.3s ease',
                color: theme.colors.primary,
                fontFamily: theme.font.family,
                '&:hover': {
                  bgcolor: `${theme.colors.primary}15`
                }
              }}
            >
              Didn't receive the code? Resend
            </Button>
          </Box>
        </Stack>
      </Box>
    </Slide>
  );

  const renderPasswordForm = () => (
    <Slide direction="left" in={step === 'password'} mountOnEnter unmountOnExit>
      <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={data.password}
            onChange={(e) => setData(prev => ({ ...prev, password: e.target.value }))}
            variant="outlined"
            helperText="Password must be at least 8 characters long"
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
              },
              '& .MuiFormHelperText-root': {
                color: theme.colors.fontMuted,
                fontFamily: theme.font.family
              }
            }}
          />

          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            required
            value={data.confirmPassword}
            onChange={(e) => setData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            variant="outlined"
            error={data.confirmPassword && data.password !== data.confirmPassword}
            helperText={data.confirmPassword && data.password !== data.confirmPassword ? "Passwords do not match" : ""}
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
              },
              '& .MuiFormHelperText-root': {
                color: theme.colors.fontMuted,
                fontFamily: theme.font.family
              }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || !data.password || !data.confirmPassword}
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
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Creating Account...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </Stack>
      </Box>
    </Slide>
  );

  const getStepIcon = () => {
    switch (step) {
      case 'initial':
        return <PersonAddIcon sx={{ fontSize: 40 }} />;
      case 'otp':
        return <EmailIcon sx={{ fontSize: 40 }} />;
      case 'password':
        return <LockIcon sx={{ fontSize: 40 }} />;
      default:
        return <PersonAddIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'initial':
        return 'Create your account';
      case 'otp':
        return 'Verify your email';
      case 'password':
        return 'Set your password';
      default:
        return 'Register';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'initial':
        return 'Enter your details to get started';
      case 'otp':
        return 'Enter the verification code sent to your email';
      case 'password':
        return 'Create a secure password for your account';
      default:
        return '';
    }
  };

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
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 5, lg:5 } }}>
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
                  {getStepIcon()}
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
                  {getStepTitle()}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, color: theme.colors.fontBodyLight, fontFamily: theme.font.family }}>
                  {getStepDescription()}
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel 
                        sx={{
                          '& .MuiStepLabel-label': {
                            color: theme.colors.fontMuted,
                            fontFamily: theme.font.family,
                            '&.Mui-active': {
                              color: theme.colors.primary
                            },
                            '&.Mui-completed': {
                              color: theme.colors.primary
                            }
                          }
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {step === 'initial' && renderInitialForm()}
              {step === 'otp' && renderOtpForm()}
              {step === 'password' && renderPasswordForm()}

              {error && (
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
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, color: theme.colors.fontMuted, fontFamily: theme.font.family }}>
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    style={{ 
                      color: theme.colors.primary, 
                      textDecoration: 'none',
                      fontWeight: 500,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default EmailRegistrationPage;