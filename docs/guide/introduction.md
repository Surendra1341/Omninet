# Introduction

**OmniNet** is a production-grade distributed microservices platform that migrates a full-featured monolithic Spring Boot application into an independently deployable, cloud-native architecture.

## What Is OmniNet?

OmniNet provides:

- **Secure Authentication** — JWT, OAuth2 (Google / GitHub), email OTP, refresh-token rotation.
- **Smart Notes** — Rich markdown notes, categories, todos, file attachments, recycle bin, and full-text search.
- **Cloud Storage** — S3/MinIO file hosting with presigned URLs, folder trees, and quota enforcement.
- **AI Assistant** — Gemini-powered chat with streaming, voice input, web search, and multi-session history.
- **Real-Time Events** — Kafka-driven async provisioning and inter-service notifications.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Spring Boot 3.5.x |
| API Gateway | Spring Cloud Gateway (Reactive / Netty) |
| Inter-Service RPC | gRPC + Protobuf |
| Event Streaming | Apache Kafka (KRaft mode) |
| Caching & State | Redis 7 |
| Persistence | PostgreSQL 16 (one DB per service) |
| Object Storage | MinIO (AWS S3-compatible) |
| AI Provider | Google Gemini + Ollama (fallback) |
| Frontend | React 18 + Vite + TailwindCSS + DaisyUI |
| Containerization | Docker Compose + Docker Swarm |
| Language | Java 21 (backend), JavaScript/JSX (frontend) |

## Repository Structure

```
Omninet/
├── omninet-microservices/       # All backend services (Maven multi-module)
│   ├── omninet-proto/           # Protobuf definitions & gRPC stubs
│   ├── omninet-common/          # Shared DTOs, filters, exception handlers
│   ├── api-gateway/             # Reactive API gateway (:8080)
│   ├── auth-service/            # Authentication & OAuth2 (:8081)
│   ├── storage-service/         # S3 storage (:8082)
│   ├── notes-service/           # Notes, todos, categories (:8083)
│   ├── ai-service/              # AI chat & voice (:8084)
│   ├── docker-compose.yml       # Full local dev stack
│   ├── docker-compose.infra.yml # Infrastructure only
│   └── docker-stack.yml         # Production Docker Swarm
├── omninet-security-web/        # React frontend (:5173)
├── Omninet-Core/                # Original monolith (reference)
└── docs/                        # VitePress documentation (this site)
```

## Next Steps

- [Quick Start](/guide/quickstart) — get the full stack running in minutes.
- [System Architecture](/architecture/overview) — understand how services connect.
- [Services](/services/auth-service) — explore each microservice in depth.
