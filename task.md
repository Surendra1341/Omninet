# Omninet Microservices Migration — Task Tracker

## Phase 1: Foundation
- [x] Parent POM (`omninet-microservices/pom.xml`)
- [x] Proto module (`omninet-proto/`) — .proto files + Maven build
- [x] Common module (`omninet-common/`) — shared DTOs, utils, security, events

## Phase 2: Auth Service
- [x] Project structure + POM
- [x] JPA entities (User, RefreshToken, PendingUser, EmailVerification)
- [x] Repositories
- [x] JWT Service (generation, validation)
- [x] Authentication Service (login, register, OAuth2)
- [x] Email Registration Service (OTP flow)
- [x] Email Service
- [x] Refresh Token Service (Redis blacklist)
- [x] User Service
- [x] REST Controllers (Auth, User, EmailRegistration)
- [x] OAuth2 Configuration (Google, GitHub)
- [x] Security Configuration
- [x] gRPC Server (UserGrpcService)
- [x] Kafka Producer (UserCreatedEvent, UserUpdatedEvent)
- [x] Redis Configuration (JWT blacklist, OTP)
- [x] Application configuration (application.yml)
- [x] Dockerfile

## Phase 3: API Gateway
- [x] Project structure + POM
- [x] Route configuration (all service routes)
- [x] JWT Authentication Filter (validate + inject headers)
- [x] Rate limiting (Redis-based)
- [x] CORS configuration
- [x] Exception handling
- [x] Application configuration (application.yml)
- [x] Dockerfile

## Phase 4: Storage Service
- [x] Project structure + POM
- [x] S3 Client configuration (AWS SDK, MinIO-compatible)
- [x] Storage Service (S3 operations)
- [x] REST Controller (presigned URLs, folder management)
- [x] gRPC Server (StorageGrpcService)
- [x] Kafka Consumer (UserCreatedEvent → create user folders)
- [x] Kafka Producer (FileUploadedEvent)
- [x] File metadata JPA entity + repository
- [x] Application configuration (application.yml)
- [x] Dockerfile

## Phase 5: Notes Service
- [x] Project structure + POM
- [x] JPA entities (Notes, Category, Todo, FileDetails)
- [x] Repositories
- [x] Notes Service (full CRUD, search, pagination, recycle bin)
- [x] Todo Service
- [x] Category Service
- [x] REST Controllers (Notes, Todo, Category)
- [x] gRPC Client (StorageGrpcClient for file ops)
- [x] Kafka Consumer (UserCreatedEvent → default categories)
- [x] Kafka Producer (NoteCreatedEvent, TodoReminderEvent)
- [x] Redis caching
- [x] Application configuration (application.yml)
- [x] Dockerfile

## Phase 6: AI Service
- [x] Project structure + POM
- [x] AiProvider interface + GeminiProvider implementation
- [x] Chat Session Service (CRUD)
- [x] JPA entities (ChatSession, ChatMessage)
- [x] REST Controllers (AI chat, sessions)
- [x] gRPC Client (StorageGrpcClient for audio)
- [x] Speech gRPC integration (STT/TTS Python service)
- [x] Streaming support (SSE)
- [x] Redis session context cache
- [x] Application configuration (application.yml)
- [x] Dockerfile

## Phase 7: Infrastructure
- [x] docker-compose.infra.yml (Postgres, Redis, Kafka, MinIO)
- [x] docker-compose.yml (full local dev stack)
- [x] docker-stack.yml (Docker Swarm production)
- [x] .env.example
- [x] Init scripts (PostgreSQL multi-database creation)

## Phase 8: Frontend (omninet-security-web)
- [x] Vite + React setup configured to Reactive API Gateway (`http://localhost:8080`)
- [x] API client layer (Axios with token refresh and error queue)
- [x] Zustand stores (authStore, notesStore, todoStore, storageStore, chatStore)
- [x] Auth pages (Login, Register, OTP verification, OAuth callback)
- [x] Dashboard page
- [x] Notes pages (list, create, edit, search, recycle bin, copy, download)
- [x] Todo page (CRUD, status toggle, filtering)
- [x] Category management (CRUD, active categories)
- [x] Storage/File Explorer page (presigned upload, download, folder tree, direct delete)
- [x] AI Chat page (Gemini chat, audio/speech synthesis, session management, streaming)
- [x] Profile page & Token management utilities
- [x] Frontend verified with `npm run build` (success)

