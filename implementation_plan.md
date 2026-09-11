# Omninet: Monolith → Distributed Microservices Migration

## Overview

Migrate the existing Omninet monolithic Spring Boot application into a distributed microservices architecture with **4 backend services + 1 API Gateway**, using **gRPC** for inter-service communication, **Kafka** for event-driven messaging, **Redis** for caching/state, **PostgreSQL** (database-per-service), **Docker Compose + Docker Swarm**, and a **TypeScript React frontend**.

> [!IMPORTANT]
> **Chat system is explicitly excluded from this implementation.** It will be added as a separate service in a future phase.

---

## Current State Analysis

The existing monolith ([Omninet-Core](file:///home/surendra/IdeaProjects/Omninet/Omninet-Core)) is a single Spring Boot 3.5.4 app containing:

| Domain | Key Files | Functionality |
|--------|-----------|---------------|
| **Security** | 15 classes (controllers, services, models, configs) | JWT auth, OAuth2 (Google/GitHub), email registration with OTP, refresh tokens, user management |
| **Notes** | 14 classes | CRUD with categories, file attachments, soft-delete/recycle bin, search, pagination, todos |
| **Storage** | 9 classes | MinIO-based file storage, presigned URLs, folder management, user isolation |
| **AI** | 14 classes | Ollama LLM chat with session history, speech recognition (STT via Python), speech synthesis (TTS via Python) |
| **Chat** | 33 classes | ⛔ **Skipped** — real-time messaging, WebSocket, RabbitMQ, contacts, voice/video calls (WebRTC) |

---

## Architecture

```
                                   ┌─────────────────────┐
                                   │   React SPA (TS)    │
                                   │  Vite + TailwindCSS │
                                   └──────────┬──────────┘
                                              │ HTTP/WS
                                   ┌──────────▼──────────┐
                                   │    API Gateway       │
                                   │ Spring Cloud Gateway │
                                   │ JWT Validation       │
                                   │ Rate Limiting (Redis)│
                                   │ Route Definitions    │
                                   └──┬──────┬──────┬────┘
                           ┌──────────┘      │      └───────────┐
                    HTTP   │          HTTP    │           HTTP   │
              ┌────────────▼──┐  ┌───────────▼──┐  ┌───────────▼───┐
              │  Auth Service │  │ Notes Service │  │ Storage Svc   │
              │  (Port 9001)  │  │ (Port 9002)   │  │ (Port 9003)   │
              │  PostgreSQL   │  │ PostgreSQL    │  │ PostgreSQL    │
              │  Redis        │  │ Redis         │  │ S3/MinIO      │
              └───────────────┘  └───────────────┘  └───────────────┘
                    │ gRPC              │ gRPC             │ gRPC
                    └───────────┬───────┘                  │
                                │                          │
                         ┌──────▼──────┐                   │
                         │  AI Service │◄──────────────────┘
                         │ (Port 9004) │    gRPC (file ops)
                         │ PostgreSQL  │
                         │ Gemini API  │
                         └─────────────┘

              ┌──────────────────────────────────┐
              │        Infrastructure             │
              │  Kafka │ Redis │ PostgreSQL (x4)  │
              │  MinIO │ Docker Swarm             │
              └──────────────────────────────────┘
```

---

## Proposed Changes

### Project Structure (New Directory Layout)

```
Omninet/
├── Omninet-Core/              # Existing monolith (untouched)
├── omninet-security-web/      # Existing frontend (untouched — replaced by new one)
│
├── omninet-microservices/     # ← NEW: Multi-module Maven project
│   ├── pom.xml                # Parent POM
│   │
│   ├── omninet-proto/         # Shared gRPC .proto definitions
│   │   ├── pom.xml
│   │   └── src/main/proto/
│   │       ├── auth.proto     # UserService, AuthValidation
│   │       ├── storage.proto  # StorageService (S3 ops)
│   │       ├── notes.proto    # NotesService (for AI integration)
│   │       └── ai.proto       # AiService
│   │
│   ├── omninet-common/        # Shared DTOs, utils, exceptions
│   │   ├── pom.xml
│   │   └── src/main/java/org/zemo/omninet/common/
│   │       ├── dto/           # ApiResponse, PageResponse
│   │       ├── exception/     # GlobalExceptionHandler, custom exceptions
│   │       ├── security/      # JwtUtil (token parsing, claim extraction)
│   │       ├── config/        # Common Redis, Kafka configs
│   │       └── event/         # Kafka event DTOs (UserCreatedEvent, etc.)
│   │
│   ├── auth-service/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/main/java/org/zemo/omninet/auth/
│   │       ├── AuthServiceApplication.java
│   │       ├── config/        # SecurityConfig, OAuth2Config, RedisConfig, KafkaProducerConfig
│   │       ├── controller/    # AuthController, UserController, EmailRegistrationController
│   │       ├── dto/           # LoginRequest, RegisterRequest, TokenResponse
│   │       ├── grpc/          # UserGrpcService (implements auth.proto)
│   │       ├── model/         # User, RefreshToken, PendingUser, EmailVerification
│   │       ├── repository/    # UserRepository, RefreshTokenRepository, etc.
│   │       ├── service/       # AuthenticationService, JwtService, EmailService, etc.
│   │       └── event/         # KafkaEventPublisher (UserCreatedEvent, UserUpdatedEvent)
│   │
│   ├── notes-service/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/main/java/org/zemo/omninet/notes/
│   │       ├── NotesServiceApplication.java
│   │       ├── config/        # SecurityConfig (trusts gateway headers), KafkaConfig, RedisConfig
│   │       ├── controller/    # NotesController, TodoController, CategoryController
│   │       ├── dto/           # NotesDto, TodoDto, NotesResponse
│   │       ├── grpc/          # NotesGrpcService, StorageGrpcClient
│   │       ├── model/         # Notes, Todo, Category, FileDetails
│   │       ├── repository/    # NotesRepo, TodoRepo, CategoryRepo, FileRepo
│   │       ├── service/       # NotesService, TodoService, CategoryService
│   │       └── event/         # KafkaEventPublisher (NoteCreatedEvent, etc.)
│   │
│   ├── storage-service/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/main/java/org/zemo/omninet/storage/
│   │       ├── StorageServiceApplication.java
│   │       ├── config/        # S3Config, SecurityConfig (trusts gateway headers), KafkaConfig
│   │       ├── controller/    # StorageController (REST for presigned URLs)
│   │       ├── dto/           # StorageResponse, FileInfoResponse, PresignedUrlResponse
│   │       ├── grpc/          # StorageGrpcService (implements storage.proto)
│   │       ├── service/       # StorageService (using AWS S3 SDK)
│   │       └── event/         # KafkaEventPublisher (FileUploadedEvent, etc.)
│   │
│   ├── ai-service/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/main/java/org/zemo/omninet/ai/
│   │       ├── AiServiceApplication.java
│   │       ├── config/        # GeminiConfig, SecurityConfig, gRPC client configs
│   │       ├── controller/    # AiController, ChatController (AI chat sessions)
│   │       ├── dto/           # ChatRequest, ChatResponse, VoiceResponse
│   │       ├── grpc/          # AiGrpcService, StorageGrpcClient, SpeechGrpcClient
│   │       ├── model/         # ChatSession, ChatMessage
│   │       ├── repository/    # ChatSessionRepository, ChatMessageRepository
│   │       ├── service/       # AiService (Gemini API, pluggable provider abstraction)
│   │       │                  # ChatSessionService, SpeechService
│   │       └── provider/      # AiProvider (interface), GeminiProvider, OllamaProvider
│   │
│   ├── api-gateway/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/main/java/org/zemo/omninet/gateway/
│   │       ├── GatewayApplication.java
│   │       ├── config/        # RouteConfig, CorsConfig, RateLimitConfig
│   │       ├── filter/        # JwtAuthenticationFilter (validates JWT, adds headers)
│   │       └── exception/     # GatewayExceptionHandler
│   │
│   ├── docker-compose.yml         # Local development
│   ├── docker-compose.infra.yml   # Infrastructure services only
│   ├── docker-stack.yml           # Docker Swarm production deployment
│   └── .env.example               # Environment variables template
│
├── omninet-web/               # ← NEW: TypeScript React frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/             # TypeScript interfaces matching backend DTOs
│       │   ├── auth.ts
│       │   ├── notes.ts
│       │   ├── storage.ts
│       │   └── ai.ts
│       ├── store/             # Zustand stores (typed)
│       │   ├── authStore.ts
│       │   ├── notesStore.ts
│       │   └── aiChatStore.ts
│       ├── services/          # API client layer
│       │   ├── api.ts         # Axios instance with interceptors
│       │   ├── authApi.ts
│       │   ├── notesApi.ts
│       │   ├── storageApi.ts
│       │   └── aiApi.ts
│       ├── hooks/             # Custom React hooks
│       ├── contexts/          # Theme, Auth contexts
│       ├── components/        # Reusable UI components
│       │   ├── ui/
│       │   ├── Notes/
│       │   ├── FileExplorer/
│       │   └── AiChat/
│       ├── pages/             # Page components
│       │   ├── LoginPage/
│       │   ├── Dashboard/
│       │   ├── Notes/
│       │   ├── Storage/
│       │   ├── AiChat/
│       │   ├── Profile/
│       │   ├── Todo/
│       │   └── LandingPage/
│       └── utils/
│           └── tokenManager.ts
```

---

### Component 1: Parent POM & Shared Modules

#### [NEW] `omninet-microservices/pom.xml`

Multi-module Maven parent POM managing:
- **Spring Boot 3.5.4** parent
- **Java 21** with virtual threads enabled
- Shared dependency versions: Spring Cloud 2025.x, gRPC Spring Boot Starter, Kafka, Redis, PostgreSQL, Lombok, MapStruct
- Module declarations for all sub-projects

#### [NEW] `omninet-proto/`

Shared protobuf definitions compiled into Java stubs.

**Key `.proto` files:**

| Proto File | Services | Used By |
|------------|----------|---------|
| `auth.proto` | `UserService` (GetUser, ValidateUser, GetUserByEmail) | notes-service, ai-service |
| `storage.proto` | `StorageService` (GenerateUploadUrl, GenerateDownloadUrl, DeleteFile, CreateFolder, ListContents) | notes-service, ai-service |
| `notes.proto` | `NotesQueryService` (GetUserNotes — for AI context) | ai-service |
| `ai.proto` | `SpeechService` (RecognizeSpeech, SynthesizeSpeech) | ai-service (to Python gRPC server) |

#### [NEW] `omninet-common/`

Shared library:
- `ApiResponse<T>` — unified response wrapper
- `PageResponse<T>` — pagination wrapper
- `JwtClaimsExtractor` — utility to parse gateway-injected headers (`X-User-Id`, `X-User-Email`, `X-User-Name`)
- `GlobalExceptionHandler` — unified `@RestControllerAdvice`
- Kafka event DTOs: `UserCreatedEvent`, `NoteCreatedEvent`, `FileUploadedEvent`, `TodoReminderEvent`
- Common Redis configuration
- Spring Security config for downstream services (trusts gateway headers)

---

### Component 2: Auth Service (Port 9001, gRPC 9051)

Migrated from: [security package](file:///home/surendra/IdeaProjects/Omninet/Omninet-Core/src/main/java/org/zemo/omninet/security)

#### Database: `omninet_auth` (PostgreSQL)

Tables: `users`, `refresh_tokens`, `pending_users`, `email_verifications`

#### Functionality preserved:

| Feature | Current | New |
|---------|---------|-----|
| Email/Password login | `AuthenticationService.authenticateUser()` | Same, returns JWT + refresh token |
| OAuth2 (Google/GitHub) | `CustomOAuth2UserService`, `SecurityConfig` | Auth-service handles OAuth2 directly, gateway proxies `/oauth2/**` |
| Email registration + OTP | `EmailRegistrationService` | Same, OTP stored in Redis (TTL-based) instead of DB |
| JWT generation/validation | `JwtService` | Same, but **refresh token revocation list stored in Redis** |
| Refresh token | `RefreshTokenService` | Same, with Redis blacklist for instant logout |
| Password management | Change password, add password to OAuth | Preserved |
| User CRUD | `UserService`, `UserController` | Preserved |
| Cleanup service | `CleanupService` | Preserved, runs as scheduled task |

#### New additions:
- **gRPC server** (`UserGrpcService`): exposes `GetUserById`, `GetUserByEmail`, `ValidateToken` for other services
- **Kafka producer**: publishes `UserCreatedEvent`, `UserUpdatedEvent` when users register/update
- **Redis**: JWT blacklist (SET with TTL), OTP storage (replacing `email_verifications` table)

---

### Component 3: Notes Service (Port 9002, gRPC 9052)

Migrated from: [notes package](file:///home/surendra/IdeaProjects/Omninet/Omninet-Core/src/main/java/org/zemo/omninet/notes)

#### Database: `omninet_notes` (PostgreSQL)

Tables: `notes`, `categories`, `file_details`, `todos`

#### Functionality preserved:

| Feature | Current | New |
|---------|---------|-----|
| Notes CRUD | `NotesServiceImpl` | Same, but file uploads go through storage-service via gRPC |
| Categories | `CategoryServiceImpl` | Preserved |
| Todos | `TodoServiceImpl` | Preserved, with Kafka events for reminders |
| File attachments | Local filesystem + `FileDetails` | **gRPC call to storage-service** for upload/download |
| Search | `NotesRepo.searchNotes()` | Preserved with PostgreSQL full-text search |
| Soft delete / recycle bin | `softDeleteNotes`, `restoreNotes`, `emptyRecycleBin` | Preserved |
| Pagination | `getAllNotesByUser(pageable)` | Preserved |
| Scheduled cleanup | `NotesSchedular` | Preserved |

#### New additions:
- **gRPC client** to storage-service for file operations
- **Kafka producer**: `NoteCreatedEvent`, `TodoReminderEvent`
- **Kafka consumer**: listens for `UserCreatedEvent` to create default categories
- **Redis**: cache note metadata, category lists
- User identity from gateway headers (`X-User-Id`, `X-User-Email`)

> [!IMPORTANT]
> The notes-service **no longer has direct access to the User entity**. User information comes exclusively from gateway-injected headers. For operations that need user details beyond what headers provide, it calls auth-service via gRPC.

---

### Component 4: Storage Service (Port 9003, gRPC 9053)

Migrated from: [storage package](file:///home/surendra/IdeaProjects/Omninet/Omninet-Core/src/main/java/org/zemo/omninet/storage)

#### Database: `omninet_storage` (PostgreSQL)

Tables: `file_metadata` (tracks file ownership, size, type, path)

#### Functionality preserved:

| Feature | Current (MinIO SDK) | New (AWS S3 SDK) |
|---------|---------------------|------------------|
| Presigned upload URL | `generatePresignedUploadUrl()` | Same, via `S3Presigner` |
| Presigned download URL | `generatePresignedDownloadUrl()` | Same, via `S3Presigner` |
| Direct upload/download | `uploadFile()`, `downloadFile()` | Same, via `S3Client` |
| Folder management | `createFolder()`, `deleteFolder()`, `folderExists()` | Same, via `S3Client` |
| List folder contents | `listDirectChildren()`, `listObjectsInFolder()` | Same, via `ListObjectsV2` |
| Delete file | `deleteFile()` | Same, via `DeleteObject` |
| File/folder existence check | `fileExists()`, `folderExists()` | Same |
| User folder initialization | `createFolderForEveryUser()` | Triggered by `UserCreatedEvent` from Kafka |
| Path validation & sanitization | `validatePath()`, `sanitizeName()` | Preserved |

#### New additions:
- **gRPC server** (`StorageGrpcService`): exposes all file operations for notes-service and ai-service
- **Kafka consumer**: listens for `UserCreatedEvent` to auto-create user folders
- **Kafka producer**: `FileUploadedEvent`, `FileDeletedEvent`
- **REST API** preserved for frontend (presigned URLs)
- **PostgreSQL** for file metadata tracking (ownership, audit trail)

---

### Component 5: AI Service (Port 9004, gRPC 9054)

Migrated from: [ai package](file:///home/surendra/IdeaProjects/Omninet/Omninet-Core/src/main/java/org/zemo/omninet/ai)

#### Database: `omninet_ai` (PostgreSQL)

Tables: `chat_sessions`, `chat_messages`

#### Functionality preserved:

| Feature | Current (Ollama) | New (Gemini with pluggable providers) |
|---------|------------------|---------------------------------------|
| Text chat | `AiService.getTextResponse()` | `AiProvider` interface → `GeminiProvider` |
| Chat with history | `getTextResponseWithHistory()` | Same, with session-aware context |
| Chat sessions | `ChatService` (CRUD) | Preserved |
| Chat messages | `ChatMessage` persistence | Preserved |
| Speech recognition (STT) | HTTP to `localhost:5000` | **gRPC to Python STT service** |
| Speech synthesis (TTS) | HTTP to `localhost:5001` | **gRPC to Python TTS service** |
| Voice response | `getSpeechResponseWithHistory()` | Preserved |

#### New architecture:
```java
// Provider abstraction — no vendor lock-in
public interface AiProvider {
    String generateResponse(String prompt, List<Message> history);
    Flux<String> streamResponse(String prompt, List<Message> history); // streaming support
}

// Implementations
class GeminiProvider implements AiProvider { ... }    // Default
class OllamaProvider implements AiProvider { ... }    // Alternative
// Future: OpenAiProvider, AnthropicProvider, etc.
```

#### New additions:
- **gRPC client** to storage-service (for audio file storage)
- **gRPC client** to Python STT/TTS services
- **Provider abstraction** with `@ConditionalOnProperty` for switching providers
- **Redis**: cache active session context
- **Streaming support** for real-time AI responses (SSE)

---

### Component 6: API Gateway (Port 8080)

#### [NEW] Spring Cloud Gateway

| Responsibility | Implementation |
|----------------|----------------|
| **Routing** | Route definitions to all downstream services |
| **JWT validation** | `JwtAuthenticationFilter` — validates JWT, extracts claims, injects `X-User-Id`, `X-User-Email`, `X-User-Name` headers |
| **Rate limiting** | Redis-based rate limiter (`RequestRateLimiterGatewayFilterFactory`) |
| **CORS** | Centralized CORS configuration (replaces per-service `@CrossOrigin`) |
| **OAuth2 proxy** | Routes `/oauth2/**`, `/login/oauth2/**` → auth-service |
| **Load balancing** | Round-robin to service instances via Docker Swarm DNS |
| **Public routes** | `/api/auth/login/**`, `/api/auth/register/**`, `/api/auth/refresh-token` bypass JWT filter |

#### Route Table:

| Path Pattern | Target Service | Auth Required |
|-------------|----------------|---------------|
| `/api/auth/**` | auth-service:9001 | Partial (login/register = no, user = yes) |
| `/oauth2/**`, `/login/oauth2/**` | auth-service:9001 | No |
| `/api/v1/notes/**` | notes-service:9002 | Yes |
| `/api/v1/todo/**` | notes-service:9002 | Yes |
| `/api/v1/category/**` | notes-service:9002 | Yes |
| `/api/storage/**` | storage-service:9003 | Yes |
| `/api/ai/**` | ai-service:9004 | Yes |
| `/actuator/**` | All services | No (internal) |

---

### Component 7: Frontend (omninet-web)

#### [NEW] Vite + React 19 + TypeScript + TailwindCSS 4

Complete rewrite of [omninet-security-web](file:///home/surendra/IdeaProjects/Omninet/omninet-security-web) in TypeScript.

| Aspect | Current | New |
|--------|---------|-----|
| Language | JavaScript | TypeScript (strict mode) |
| Styling | TailwindCSS 4 + MUI | TailwindCSS 4 only |
| State | Zustand (JS) | Zustand (typed) |
| Routing | react-router-dom v7 | react-router-dom v7 (typed) |
| HTTP client | Axios | Axios with typed interceptors |
| API base URL | `http://localhost:8080` | Gateway URL (same port, all routes proxied) |
| WebSocket | STOMP + SockJS | ⛔ Excluded (chat skipped) |

#### Pages to implement:
1. **Landing Page** — public marketing page
2. **Login/Register** — email + OAuth2 (Google, GitHub)
3. **Dashboard** — overview/home after login
4. **Notes** — CRUD, categories, search, file attachments, recycle bin
5. **Todos** — task management with status tracking
6. **Storage** — file explorer (folders, upload/download, delete)
7. **AI Chat** — text/voice chat with AI, session management
8. **Profile** — user profile, password management

---

### Component 8: Infrastructure (Docker)

#### `docker-compose.yml` (Local Development)

```yaml
services:
  # Infrastructure
  postgres:        # Single PostgreSQL instance, multiple databases
  redis:           # Redis 7+
  kafka:           # KRaft mode (no ZooKeeper)
  minio:           # S3-compatible object storage
  
  # Application services
  api-gateway:     # Port 8080
  auth-service:    # Port 9001, gRPC 9051
  notes-service:   # Port 9002, gRPC 9052
  storage-service: # Port 9003, gRPC 9053
  ai-service:      # Port 9004, gRPC 9054
```

#### `docker-stack.yml` (Docker Swarm Production)

- Service replicas (2+ per service)
- Health checks
- Resource limits
- Docker secrets for credentials
- Overlay networks for service isolation
- Rolling update configuration

---

## Kafka Event Flow

```
auth-service ──► UserCreatedEvent ──► notes-service (create default categories)
                                  ──► storage-service (create user folder)

notes-service ──► NoteCreatedEvent ──► (audit log / future analytics)
              ──► TodoReminderEvent ──► notification-service (future)

storage-service ──► FileUploadedEvent ──► (audit log / future analytics)
```

---

## Redis Usage Map

| Service | Redis Usage | Key Pattern |
|---------|-------------|-------------|
| **API Gateway** | Rate limiting | `rate_limit:{ip}:{path}` |
| **Auth Service** | JWT blacklist, OTP storage | `jwt:blacklist:{jti}`, `otp:{email}` |
| **Notes Service** | Category cache, notes metadata cache | `cache:categories:{userId}`, `cache:notes:{userId}:{page}` |
| **AI Service** | Active session context cache | `ai:session:{sessionId}:context` |

---

## gRPC Service Map

| Service | gRPC Role | Port | Proto |
|---------|-----------|------|-------|
| auth-service | **Server** | 9051 | `auth.proto` → `UserService` |
| storage-service | **Server** | 9053 | `storage.proto` → `StorageService` |
| notes-service | **Client** | — | calls `auth.proto`, `storage.proto` |
| ai-service | **Client** | — | calls `storage.proto` |
| ai-service | **Client** | — | calls `ai.proto` → Python STT/TTS gRPC |

---

## Execution Order

The implementation will proceed in this order:

1. **Phase 1: Foundation** — Parent POM, proto module, common module
2. **Phase 2: Auth Service** — User management, JWT, OAuth2, email registration, Redis, Kafka producer
3. **Phase 3: API Gateway** — Routing, JWT filter, rate limiting, CORS
4. **Phase 4: Storage Service** — S3 SDK, gRPC server, Kafka consumer
5. **Phase 5: Notes Service** — Full CRUD, gRPC clients, Kafka events
6. **Phase 6: AI Service** — Gemini provider, chat sessions, gRPC speech
7. **Phase 7: Infrastructure** — Docker Compose, Docker Swarm configs
8. **Phase 8: Frontend** — TypeScript React app (complete rewrite)

---

## Verification Plan

### Automated Tests
```bash
# Build all modules
cd omninet-microservices && mvn clean install

# Run unit tests per service
mvn test -pl auth-service
mvn test -pl notes-service
mvn test -pl storage-service
mvn test -pl ai-service

# Start infrastructure
docker compose -f docker-compose.infra.yml up -d

# Start all services
docker compose up -d

# Verify health endpoints
curl http://localhost:8080/actuator/health          # Gateway
curl http://localhost:9001/actuator/health          # Auth
curl http://localhost:9002/actuator/health          # Notes
curl http://localhost:9003/actuator/health          # Storage
curl http://localhost:9004/actuator/health          # AI
```

### Manual Verification
- Full auth flow: register → verify OTP → login → refresh token → logout
- OAuth2 flow: Google/GitHub login through gateway
- Notes CRUD: create with file attachment → search → soft delete → restore → hard delete
- Storage: create folder → upload file → download → delete
- AI Chat: create session → send messages → get response (streaming) → view history
- Frontend: full end-to-end testing of all pages

### Docker Swarm Deployment
```bash
docker stack deploy -c docker-stack.yml omninet
docker service ls
docker service logs omninet_auth-service
```

---

> [!WARNING]
> **Breaking Changes**: The new microservices architecture uses different API paths, headers, and authentication flow compared to the monolith. The existing frontend (`omninet-security-web`) will NOT work with the new backend without modifications. The new `omninet-web` frontend is designed specifically for the microservices backend.

> [!NOTE]
> **Data Migration**: The existing monolith's database schema will need a one-time data migration script to split data across the 4 service databases. This script is NOT part of the initial implementation but can be added as a follow-up task.
