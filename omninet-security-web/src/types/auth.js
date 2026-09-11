/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [avatarUrl]
 * @property {'github' | 'google' | 'email'} provider
 * @property {string} [primaryProvider]
 * @property {string} [linkedProviders]
 * @property {boolean} accountMerged
 * @property {string} createdAt
 * @property {string} lastLoginAt
 * @property {Record<string, any>} [attributes]
 * @property {boolean} [emailVerified]
 * @property {string} [registrationSource]
 */

/**
 * @typedef {Object} UserProfile
 * @property {User} user
 * @property {Record<string, any>} attributes
 * @property {string[]} authorities
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalUsers
 * @property {number} githubUsers
 * @property {number} googleUsers
 * @property {number} mergedAccounts
 * @property {number} otherProviders
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 */

/**
 * @typedef {Object} EmailRegistrationInitiateRequest
 * @property {string} email
 * @property {string} name
 */

/**
 * @typedef {Object} EmailRegistrationInitiateResponse
 * @property {boolean} success
 * @property {string} message
 * @property {boolean} hasExistingOAuth
 * @property {string[]} [existingProviders]
 */

/**
 * @typedef {Object} EmailVerificationRequest
 * @property {string} email
 * @property {string} otpCode
 */

/**
 * @typedef {Object} EmailVerificationResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} verificationToken
 * @property {boolean} hasConflict
 * @property {Object} [conflictDetails]
 * @property {string[]} conflictDetails.existingProviders
 * @property {boolean} conflictDetails.requiresConfirmation
 */

/**
 * @typedef {Object} EmailRegistrationCompleteRequest
 * @property {string} email
 * @property {string} name
 * @property {string} password
 * @property {string} verificationToken
 */

/**
 * @typedef {Object} EmailRegistrationCompleteResponse
 * @property {boolean} success
 * @property {string} message
 * @property {User} [user]
 * @property {boolean} [merged]
 * @property {string} [mergedProviders]
 */

/**
 * @typedef {Object} EmailLoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object|null} data
 * @property {User} data.user
 * @property {string} data.accessToken
 * @property {string} data.refreshToken
 * @property {string} data.tokenType
 * @property {number} data.expiresIn
 * @property {string} data.authMethod
 * @property {boolean} data.hasMultipleProviders
 * @property {string} [error]
 */

/**
 * @typedef {Object} RefreshTokenRequest
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} RefreshTokenResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object|null} data
 * @property {string} data.accessToken
 * @property {string} data.tokenType
 * @property {number} data.expiresIn
 */

/**
 * @typedef {Object} LogoutRequest
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} LogoutResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object|null} data
 * @property {string} data.message
 */

/**
 * @typedef {Object} UserResponse
 * @property {boolean} success
 * @property {string} message
 * @property {User|null} data
 */

/**
 * @typedef {Object} AuthMethodsResponse
 * @property {boolean} success
 * @property {string} message
 * @property {Object} data
 * @property {boolean} data.emailPassword
 * @property {boolean} data.oauth
 * @property {string[]} data.providers
 * @property {boolean} data.canRegister
 * @property {boolean} data.accountExists
 */

/**
 * @typedef {Object} CheckEmailResponse
 * @property {boolean} available
 * @property {string} message
 */

/**
 * @typedef {Object} TokenStorage
 * @property {string|null} accessToken
 * @property {string|null} refreshToken
 * @property {string} tokenType
 * @property {number|null} expiresAt
 */

// Export empty object to make this a module
export {};
