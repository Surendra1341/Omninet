# System Architecture Overview

OmniNet follows a **microservices architecture** where each domain is independently deployable, communicating via **gRPC** (synchronous RPC) and **Apache Kafka** (asynchronous events).

---

## High-Level System Diagram

```mermaid
graph TB
    Client(["🖥️ React + Vite\nFrontend :5173"])

    Gateway["🔀 API Gateway\n:8080\nJWT · Rate Limit · CORS"]

    Auth["🔐 Auth Service\n:8081 / gRPC :9091\nJWT · OAuth2 · OTP"]
    Notes["📝 Notes Service\n:8083 / gRPC :9093\nNotes · Todos · Categories"]
    Storage["🗂️ Storage Service\n:8082 / gRPC :9095\nS3 · MinIO · Quotas"]
    AI["🤖 AI Service\n:8084 / gRPC :9094\nGemini · Voice · SSE"]

    subgraph infra ["⚙️ Shared Infrastructure"]
        PG[("🐘 PostgreSQL :5432\n4 Isolated Databases")]
        Redis[("⚡ Redis :6379\nCache · Blacklist")]
        Kafka[("📨 Kafka :9092\nEvent Streaming")]
        MinIO[("📦 MinIO :9000\nObject Storage")]
    end

    Client -->|"HTTP / SSE"| Gateway
    Gateway -->|"JWT Auth"| Auth
    Gateway -->|"Proxy"| Notes
    Gateway -->|"Proxy"| Storage
    Gateway -->|"Proxy + SSE"| AI

    Auth -.->|"USER_CREATED"| Kafka
    Kafka -.->|"Provision Folders"| Storage
    Kafka -.->|"Default Categories"| Notes
    Notes -->|"gRPC: File Ops"| Storage
    AI -->|"gRPC: Audio + Files"| Storage

    Auth --- PG
    Notes --- PG
    Storage --- PG
    AI --- PG
    Gateway --- Redis
    Auth --- Redis
    AI --- Redis
    Storage --- MinIO
```

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Browser
    participant G as API Gateway
    participant A as Auth Service
    participant S as Service

    C->>G: HTTP Request + JWT
    G->>G: Validate JWT signature
    G->>G: Check Redis blacklist
    G->>G: Apply rate limiting
    G->>S: Forward + X-User-Id, X-User-Email
    S->>S: Business logic (trusts gateway headers)
    S->>G: Response
    G->>C: Response
```

---

## Design Principles

### Database-per-Service

Each service owns its own **PostgreSQL database**. No direct cross-service DB queries — data sharing happens through APIs or Kafka events.

| Service | Database |
|---------|----------|
| auth-service | `omninet_auth` |
| storage-service | `omninet_storage` |
| notes-service | `omninet_notes` |
| ai-service | `omninet_ai` |

### Single Entry Point

All client requests enter through the **API Gateway** at `:8080`. The gateway validates JWTs, enriches requests with `X-User-Id` and `X-User-Email` headers, applies Redis-backed rate limiting, and routes to the correct service.

### Synchronous Communication — gRPC

Latency-sensitive operations use **gRPC** with Protobuf-defined contracts from the `omninet-proto` module.

### Asynchronous Communication — Kafka

Fire-and-forget events that fan out to multiple consumers use **Apache Kafka**:
- `USER_CREATED` → Storage provisions folders, Notes provisions categories
- `FILE_EVENTS` → Storage quota reconciliation
- `NOTE_EVENTS` → Note-change auditing

## Security Model

```mermaid
graph LR
    Browser -->|"Bearer JWT"| GW["API Gateway"]
    GW -->|"Validate sig\nCheck Redis blacklist\nRate limit"| GW
    GW -->|"X-User-Id\nX-User-Email"| SVC["Microservice"]
    SVC -->|"Trusts gateway headers\nNo JWT re-validation"| SVC
```

> [!NOTE]
> Downstream services trust `X-User-Id` / `X-User-Email` headers set by the gateway. The gateway is the single security enforcement point.
