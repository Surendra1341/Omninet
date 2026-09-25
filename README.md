<div align="center">
  <h1>🌐 OmniNet</h1>
  <p><strong>A production-grade distributed microservices platform</strong></p>
  <p>Notes · Storage · AI Chat · Authentication · Events</p>

  <a href="https://surendra1341.github.io/Omninet/">📚 Documentation</a> ·
  <a href="https://github.com/Surendra1341/Omninet/issues">🐛 Report Bug</a> ·
  <a href="#quick-start">🚀 Quick Start</a>

  <br/><br/>

  <img src="https://img.shields.io/badge/Java-21-orange?logo=java" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-green?logo=springboot" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/Kafka-KRaft-black?logo=apachekafka" />
  <img src="https://img.shields.io/badge/gRPC-Protobuf-blueviolet?logo=grpc" />
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" />
  <img src="https://img.shields.io/badge/Gemini-AI-purple?logo=google" />
</div>

---

## ✨ What is OmniNet?

OmniNet is a full-featured, cloud-native platform built with a distributed microservices architecture. It migrates a feature-complete Spring Boot monolith into independently deployable services communicating via **gRPC** and **Apache Kafka**.

### Features

| Module | Capabilities |
|--------|-------------|
| 🔐 **Auth** | JWT, OAuth2 (Google/GitHub), Email OTP, Multi-device refresh token rotation |
| 📝 **Notes** | Rich CRUD, categories, todos, file attachments, recycle bin, pin/favourite, search |
| 🗂️ **Storage** | S3/MinIO, presigned URLs, folder hierarchies, per-user quotas |
| 🤖 **AI Chat** | Gemini streaming, multi-session, web search, voice input, markdown rendering |
| ⚡ **Events** | Kafka-driven user provisioning, storage auditing, reminder scheduling |
| 🔀 **gRPC** | Strongly-typed inter-service RPC with Protobuf contracts |

---

## 🏗️ Architecture

```
Client (React + Vite)
        │ HTTP / SSE
        ▼
API Gateway (Spring Cloud Gateway :8080)
        │ JWT Validation · Rate Limiting · Header Enrichment
        ├─────────────────────────────┐
        ▼                             ▼
auth-service (:8081)         notes-service (:8083)
        │ gRPC                        │ gRPC → storage-service
storage-service (:8082)      ai-service (:8084)
        │ MinIO / S3                  │ Gemini + Ollama
        └────────────────────────────┘
            Kafka · Redis · PostgreSQL (per service)
```

Full architecture diagrams and service documentation: **[docs.omninet](https://surendra1341.github.io/Omninet/)**

---

## 🚀 Quick Start

### Prerequisites

- Docker 24+ & Docker Compose v2
- Node.js 18+ & npm 9+

### 1. Clone & configure

```bash
git clone https://github.com/Surendra1341/Omninet.git
cd Omninet/omninet-microservices
cp .env.example .env
# Edit .env with your OAuth2 credentials, Gemini API key, and mail settings
```

### 2. Start all services

```bash
docker compose up --build -d
```

### 3. Start the frontend

```bash
cd ../omninet-security-web
npm install && npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** 🎉

---

## 📁 Project Structure

```
Omninet/
├── omninet-microservices/       # Backend (Maven multi-module)
│   ├── omninet-proto/           # Protobuf + gRPC stubs
│   ├── omninet-common/          # Shared DTOs, filters, events
│   ├── api-gateway/             # Reactive gateway (:8080)
│   ├── auth-service/            # Auth & OAuth2 (:8081)
│   ├── storage-service/         # S3/MinIO (:8082)
│   ├── notes-service/           # Notes, todos, categories (:8083)
│   ├── ai-service/              # AI chat & voice (:8084)
│   ├── docker-compose.yml       # Full dev stack
│   ├── docker-compose.infra.yml # Infrastructure only
│   └── docker-stack.yml         # Production Swarm
├── omninet-security-web/        # React frontend (:5173)
├── Omninet-Core/                # Original monolith (reference)
└── docs/                        # VitePress documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.5, Spring Cloud Gateway, Spring Security |
| RPC | gRPC + Protobuf |
| Events | Apache Kafka (KRaft) |
| Cache | Redis 7 |
| Database | PostgreSQL 16 (one DB per service) |
| Storage | MinIO (S3-compatible) |
| AI | Google Gemini + Ollama (fallback) |
| Frontend | React 18, Vite, TailwindCSS, DaisyUI, Zustand, GSAP, Lenis |
| Container | Docker Compose + Docker Swarm |
| Java | 21 (Virtual Threads ready) |

---

## 📚 Documentation

Full documentation is available at **[https://surendra1341.github.io/Omninet/](https://surendra1341.github.io/Omninet/)**

| Section | Description |
|---------|------------|
| [Introduction](https://surendra1341.github.io/Omninet/guide/introduction) | What is OmniNet, tech stack, repo structure |
| [Quick Start](https://surendra1341.github.io/Omninet/guide/quickstart) | Get up and running fast |
| [Configuration](https://surendra1341.github.io/Omninet/guide/configuration) | All environment variables |
| [Architecture](https://surendra1341.github.io/Omninet/architecture/overview) | System diagrams and design principles |
| [Services](https://surendra1341.github.io/Omninet/services/auth-service) | Per-service API and feature docs |
| [Frontend](https://surendra1341.github.io/Omninet/frontend/overview) | React app structure and state management |
| [Deployment](https://surendra1341.github.io/Omninet/deployment/docker) | Docker, Swarm, and local development |
| [Troubleshooting](https://surendra1341.github.io/Omninet/deployment/troubleshooting) | 17 documented issues and fixes |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.
