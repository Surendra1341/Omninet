import { create } from 'zustand';
import { authAPI } from '../services/api';
import { tokenManager } from '../utils/tokenManager';
import {API_BASE_URL} from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true, error: null });
      // console.log('Checking auth status...');

      // Check if we have valid tokens
      if (!tokenManager.isAuthenticated()) {
        // console.log('No valid tokens found');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return;
      }

      // Get user data from backend
      const response = await authAPI.getCurrentUser();
      // console.log('Auth response:', response);

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false
        });
        // console.log('User authenticated:', response.data);
      } else {
        // console.log('Failed to get user data');
        tokenManager.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStatus = error?.response?.status;
      // console.log('Auth check failed:', errorStatus, errorMessage);

      // Clear tokens on auth failure
      tokenManager.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  login: (provider) => {
    const urls = {
      github: `${API_BASE_URL}/oauth2/authorization/github`,
      google: `${API_BASE_URL}/oauth2/authorization/google`
    };
    window.location.href = urls[provider];
  },

  loginWithEmail: async (data) => {
    try {
      set({ isLoading: true, error: null });
      // console.log('Logging in with email...');

      const response = await authAPI.loginWithEmail(data);
      // console.log('Email login response:', response);

      if (response.success && response.data) {
        // Store JWT tokens
        tokenManager.setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          tokenType: response.data.tokenType,
          expiresIn: response.data.expiresIn
        });

        // Set user data
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false
        });
        // console.log('User authenticated:', response.data.user);

      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Email login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  handleOAuthCallback: async (urlParams) => {
    try {
      set({ isLoading: true, error: null });
      // console.log('Handling OAuth callback...');

      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const tokenType = urlParams.get('token_type') || 'Bearer';
      const expiresIn = parseInt(urlParams.get('expires_in') || '3600000');

      if (!accessToken || !refreshToken) {
        throw new Error('Missing tokens in OAuth callback');
      }

      // Store tokens
      tokenManager.setTokens({
        accessToken,
        refreshToken,
        tokenType,
        expiresIn
      });

      // Get user data
      await get().checkAuthStatus();

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // console.log('OAuth login successful');
    } catch (error) {
      console.error('OAuth callback error:', error);
      set({
        isLoading: false,
        error: error.message || 'OAuth authentication failed'
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // console.log('Logging out...');
      set({ isLoading: true });

      // Call logout API to revoke refresh token
      await authAPI.logout();
      // console.log('Logout API call successful');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local tokens and state
      tokenManager.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });

      // Redirect to login
      window.location.replace('/login');
    }
  },

  logoutAll: async () => {
    try {
      // console.log('Logging out from all devices...');
      set({ isLoading: true });

      await authAPI.logoutAll();
      // console.log('Logout all successful');
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      // Clear local tokens and state
      tokenManager.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });

      window.location.replace('/login');
    }
  },

  // Email Registration Methods
  initiateEmailRegistration: async (data) => {
    try {
      set({ error: null });
      const response = await authAPI.initiateEmailRegistration(data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration initiation failed';
      set({ error: errorMessage });
      throw error;
    }
  },

  verifyEmailOtp: async (data) => {
    try {
      set({ error: null });
      const response = await authAPI.verifyEmailOtp(data);
      return response.data;
    } catch (error) {
      console.error('OTP verification error details:', error);

      let errorMessage = 'OTP verification failed';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }

      set({ error: errorMessage });
      throw error;
    }
  },

  completeEmailRegistration: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.completeEmailRegistration(data);

      if (response.data.success) {
        // After successful registration, check auth status to get user data
        await get().checkAuthStatus();
      }

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration completion failed';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  resendOtp: async (email) => {
    try {
      set({ error: null });
      await authAPI.resendOtp({ email });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      set({ error: errorMessage });
      throw error;
    }
  },

  checkEmail: async (email) => {
    try {
      set({ error: null });
      const response = await authAPI.checkEmail(email);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email check failed';
      set({ error: errorMessage });
      throw error;
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Add or set a password for current user (for OAuth accounts that want password login)
  addPassword: async ({ email, password, confirmPassword }) => {
    try {
      set({ isLoading: true, error: null });

      const stateUser = get().user;
      const targetEmail = email || stateUser?.email;
      if (!targetEmail) throw new Error('Email is required');
      if (!password) throw new Error('Password is required');
      if (password !== confirmPassword) throw new Error('Passwords do not match');

      const response = await authAPI.addPassword(targetEmail, password);

      // If success, mark user as having password in attributes
      if (response?.success) {
        const updatedUser = {
          ...stateUser,
          attributes: {
            ...(stateUser?.attributes || {}),
            hasPassword: true,
          },
        };
        set({ user: updatedUser, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return response;
    } catch (error) {
      console.error('addPassword error:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to add password';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  // Backward-compatible alias for requested name
  addPasword: async (args) => await get().addPassword(args),

  // Change password (only if email is in linked providers)
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      set({ isLoading: true, error: null });

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All password fields are required');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const user = get().user;
      const rawLinked = user?.linkedProviders ?? user?.attributes?.linkedProviders ?? [];
      const linked = Array.isArray(rawLinked)
        ? rawLinked.map((p) => String(p).toLowerCase())
        : typeof rawLinked === 'string'
          ? rawLinked
              .split(/[\s,]+/)
              .map((p) => p.trim().toLowerCase())
              .filter(Boolean)
          : [];

      if (!linked.includes('email')) {
        throw new Error('Email provider is not linked to this account');
      }

      const response = await authAPI.changePassword(currentPassword, newPassword);
      set({ isLoading: false });
      return response;
    } catch (error) {
      console.error('changePassword error:', error);
      const message = error?.response?.data?.message || error.message || 'Failed to change password';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
}));
