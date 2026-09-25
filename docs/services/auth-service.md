# Auth Service

**Port:** `8081` (HTTP) · `9091` (gRPC)  
**Database:** `omninet_auth`

The auth service handles all identity and authentication concerns for the platform.

## Features

- **JWT Authentication** — Short-lived access tokens (15 min) + long-lived refresh tokens (30 days).
- **OAuth2** — Google and GitHub OAuth2 social login.
- **Email OTP Registration** — New users verify their email with a 6-digit OTP before account activation.
- **Refresh Token Rotation** — Every refresh produces a new refresh token. Old tokens are immediately blacklisted in Redis.
- **Multi-Device Support** — Each device gets its own refresh token; revoking one does not affect others.
- **gRPC Service** — Exposes `UserServiceGrpc` for internal queries from other services.
- **Kafka Producer** — Publishes `USER_CREATED` and `USER_UPDATED` events.

## REST API

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/login` | — | Login with email/password |
| `POST` | `/api/v1/auth/register` | — | Start email registration (returns OTP challenge) |
| `POST` | `/api/v1/auth/verify-otp` | — | Verify OTP and activate account |
| `POST` | `/api/v1/auth/refresh-token` | refresh token | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | JWT | Blacklist tokens |
| `GET`  | `/api/v1/auth/user` | JWT | Get current user profile |

### OAuth2

| Path | Description |
|------|-------------|
| `/oauth2/authorization/google` | Start Google OAuth2 flow |
| `/oauth2/authorization/github` | Start GitHub OAuth2 flow |
| `/login/oauth2/code/google` | Google callback (redirects with tokens) |

## JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["ROLE_USER"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

## Key Entities

- **`User`** — Core user entity with email, password hash, OAuth provider, and roles.
- **`RefreshToken`** — Per-device refresh token with expiry and Redis blacklist integration.
- **`PendingUser`** — Temporary record for users awaiting OTP verification.
- **`EmailVerification`** — OTP record with TTL.

## Security Configuration

The gateway's `OPEN_ENDPOINTS` whitelist (no JWT required):

```
/api/v1/auth/login
/api/v1/auth/register
/api/v1/auth/verify-otp
/api/v1/auth/refresh-token
/oauth2/**
/login/oauth2/**
```

## gRPC Operations

Exposed via `UserGrpcService` at `:9091`:

```
GetUserById(userId) → UserResponse
GetUserByEmail(email) → UserResponse
ValidateToken(token) → ValidationResponse
UpdateUserQuota(userId, quotaBytes) → UserResponse
```
