# Module Inventory & Port Allocation

OmniNet is structured as a Maven multi-module project under `omninet-microservices/`.

## Module Overview

| Module | HTTP Port | gRPC Port | Database | Primary Role |
| :--- | :--- | :--- | :--- | :--- |
| **`omninet-proto`** | — | — | — | Protobuf definitions (`auth.proto`, `storage.proto`, `notes.proto`, `ai.proto`) and generated gRPC stubs |
| **`omninet-common`** | — | — | — | Shared DTOs (`ApiResponse`, `PageResponse`), security filters (`GatewayHeaders`, `GatewayAuthenticationFilter`), exception handlers, Kafka event definitions |
| **`api-gateway`** | **8080** | — | Redis | Reactive Spring Cloud Gateway; Netty; JWT validation; Redis token blacklist; Rate Limiting; CORS; Request header enrichment (`X-User-Id`, `X-User-Email`) |
| **`auth-service`** | **8081** | **9091** | `omninet_auth` | User registration (OTP flow), JWT issuing/refresh rotation, OAuth2 (Google/GitHub), `UserGrpcService`, Kafka event publishing (`USER_CREATED`) |
| **`storage-service`**| **8082** | **9095** | `omninet_storage`| S3/MinIO operations, presigned upload/download URLs, folder tree management, quota enforcement, `StorageGrpcService`, Kafka consumer |
| **`notes-service`**  | **8083** | **9093** | `omninet_notes`  | Notes CRUD, categories, todos, search, 30-day recycle bin, `StorageGrpcClient` for attachments, Kafka event publishing and consumption |
| **`ai-service`**     | **8084** | **9094** | `omninet_ai`     | Chat sessions, Gemini AI provider, Ollama provider, voice chat, SSE streaming, gRPC client for storage and speech |
| **`omninet-security-web`** | **5173** | — | — | Vite React SPA connecting to `http://localhost:8080` (API Gateway) |

## Dependency Graph

```
omninet-proto
    └── (generated gRPC stubs)

omninet-common
    └── depends on: omninet-proto

api-gateway
    └── depends on: omninet-common

auth-service
    └── depends on: omninet-common

storage-service
    └── depends on: omninet-common, omninet-proto

notes-service
    └── depends on: omninet-common, omninet-proto
    └── gRPC client → storage-service

ai-service
    └── depends on: omninet-common, omninet-proto
    └── gRPC client → storage-service
```

## Maven Reactor Build Order

```
[INFO] Omninet Microservices ................................ SUCCESS
[INFO] Omninet Proto ........................................ SUCCESS
[INFO] Omninet Common ....................................... SUCCESS
[INFO] Omninet Auth Service ................................. SUCCESS
[INFO] Omninet API Gateway .................................. SUCCESS
[INFO] Omninet Storage Service .............................. SUCCESS
[INFO] Omninet Notes Service ................................ SUCCESS
[INFO] Omninet AI Service ................................... SUCCESS
[INFO] BUILD SUCCESS
```

Build all modules (skipping tests):

```bash
cd omninet-microservices
mvn clean install -DskipTests
```
