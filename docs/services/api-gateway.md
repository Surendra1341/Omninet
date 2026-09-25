# API Gateway

**Port:** `8080` (HTTP/HTTPS)  
**Runtime:** Spring Cloud Gateway (Reactive / Netty)

The API Gateway is the single entry point for all client requests. It handles JWT validation, routing, rate limiting, CORS, and header enrichment.

## Responsibilities

- **JWT Validation** — Validates `Authorization: Bearer <token>` on every protected request. Checks Redis token blacklist.
- **Header Enrichment** — Injects `X-User-Id` and `X-User-Email` into forwarded requests so downstream services don't need to parse JWTs.
- **Rate Limiting** — Redis-backed per-user rate limits (`RequestRateLimiter` filter).
- **CORS** — Centralized CORS policy; downstream services have CORS disabled.
- **Routing** — Routes requests to auth, storage, notes, and ai services.
- **Response Header Deduplication** — `DedupeResponseHeader` removes duplicate `Access-Control-Allow-Origin` headers.

## Route Configuration

| Prefix | Forwarded To | Notes |
|--------|-------------|-------|
| `/api/v1/auth/**` | `auth-service:8081` | Public routes whitelisted |
| `/oauth2/**` | `auth-service:8081` | OAuth2 initiation |
| `/login/**` | `auth-service:8081` | OAuth2 callbacks |
| `/api/v1/storage/**` | `storage-service:8082` | JWT required |
| `/api/v1/notes/**` | `notes-service:8083` | JWT required |
| `/api/v1/todos/**` | `notes-service:8083` | JWT required |
| `/api/v1/category/**` | `notes-service:8083` | JWT required |
| `/api/chat/**` | `ai-service:8084` | JWT required |
| `/api/ai/**` | `ai-service:8084` | JWT required; SSE |
| `/ws/**` | `ai-service:8084` | WebSocket / SockJS |

## Spring Cloud Gateway Property Path

> [!IMPORTANT]
> OmniNet uses Spring Cloud Gateway **4.3.0** with Spring Boot 3.5.x. In this version, `routes` and `default-filters` must be nested under:
> ```yaml
> spring.cloud.gateway.server.webflux
> ```
> not the old `spring.cloud.gateway` prefix (which is silently ignored).

## Public Endpoints (No JWT Required)

```
/api/v1/auth/login
/api/v1/auth/register
/api/v1/auth/verify-otp
/api/v1/auth/refresh-token
/api/v1/auth/logout
/oauth2/**
/login/oauth2/**
/ws/**
/actuator/health
```

## Rate Limiting

Rate limits are enforced per `X-User-Id` using the Redis `RequestRateLimiter`:

```yaml
filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter.replenishRate: 10
      redis-rate-limiter.burstCapacity: 20
      key-resolver: "#{@userKeyResolver}"
```
