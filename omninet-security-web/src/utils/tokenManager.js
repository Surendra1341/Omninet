const TOKEN_STORAGE_KEY = 'omninet_auth_tokens';

export class TokenManager {
  static instance;

  static getInstance() {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Store tokens securely
  setTokens(tokens) {
    const tokenData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt: Date.now() + tokens.expiresIn
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
  }

  // Get stored tokens
  getTokens() {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      return {
        accessToken: null,
        refreshToken: null,
        tokenType: 'Bearer',
        expiresAt: null
      };
    }

    try {
      return JSON.parse(stored);
    } catch {
      this.clearTokens();
      return {
        accessToken: null,
        refreshToken: null,
        tokenType: 'Bearer',
        expiresAt: null
      };
    }
  }

  // Get access token if valid
  getAccessToken() {
    const tokens = this.getTokens();
    if (!tokens.accessToken || !tokens.expiresAt) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() + fiveMinutes >= tokens.expiresAt) {
      return null;
    }

    return tokens.accessToken;
  }

  // Get refresh token
  getRefreshToken() {
    const tokens = this.getTokens();
    return tokens.refreshToken;
  }

  // Check if access token is expired
  isAccessTokenExpired() {
    const tokens = this.getTokens();
    if (!tokens.expiresAt) return true;

    // Consider expired if less than 5 minutes remaining
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes >= tokens.expiresAt;
  }

  // Update only access token (for refresh)
  updateAccessToken(accessToken, expiresIn) {
    const tokens = this.getTokens();
    tokens.accessToken = accessToken;
    tokens.expiresAt = Date.now() + expiresIn;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  }

  // Clear all tokens
  clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken || refreshToken);
  }
}

export const tokenManager = TokenManager.getInstance();
