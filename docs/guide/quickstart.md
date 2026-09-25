# Quick Start

Get OmniNet running on your machine in under 5 minutes using Docker Compose.

## Prerequisites

| Tool | Minimum Version |
|------|-----------------|
| Docker | 24.x |
| Docker Compose | 2.x (v2 plugin) |
| Node.js | 18.x |
| npm | 9.x |

> [!TIP]
> For hybrid development (infra in Docker, services in your IDE), you also need Java 21 and Maven 3.9.

---

## Option A — Full Docker Stack (Recommended)

### 1. Clone the repository

```bash
git clone https://github.com/Surendra1341/Omninet.git
cd Omninet
```

### 2. Configure environment variables

```bash
cd omninet-microservices
cp .env.example .env
```

Edit `.env` with your credentials:

```dotenv
# Required for OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Required for AI chat
GEMINI_API_KEY=your-gemini-api-key

# Mail (for OTP email registration)
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-app-password
```

### 3. Start everything

```bash
docker compose up --build -d
```

This starts:
- PostgreSQL (with 4 initialised databases)
- Redis
- Kafka (KRaft mode)
- MinIO (S3-compatible storage)
- API Gateway `:8080`
- Auth Service `:8081`
- Storage Service `:8082`
- Notes Service `:8083`
- AI Service `:8084`

### 4. Start the frontend

```bash
cd ../omninet-security-web
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Option B — Hybrid Development

Run infrastructure in Docker; run individual services in your IDE or terminal.

### 1. Start infrastructure only

```bash
cd omninet-microservices
docker compose -f docker-compose.infra.yml up -d
```

### 2. Build all Maven modules

```bash
export JAVA_HOME=/path/to/java21
mvn clean install -DskipTests
```

### 3. Run services

```bash
# Terminal 1 — API Gateway
cd api-gateway && mvn spring-boot:run

# Terminal 2 — Auth Service
cd auth-service && mvn spring-boot:run

# Terminal 3 — Storage Service
cd storage-service && mvn spring-boot:run

# Terminal 4 — Notes Service
cd notes-service && mvn spring-boot:run

# Terminal 5 — AI Service
cd ai-service && mvn spring-boot:run
```

---

## Verifying Your Setup

Once everything is running, hit these endpoints from your browser or curl:

| URL | Expected |
|-----|----------|
| `http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| `http://localhost:8081/api/v1/auth/user` (with JWT) | User profile JSON |
| `http://localhost:8082/api/v1/storage/stats` | Quota stats |
| `http://localhost:8083/api/v1/notes` | Notes list |
| `http://localhost:8084/api/chat/sessions` | Chat sessions |
| `http://localhost:9001` | MinIO admin console |

> [!NOTE]
> The MinIO admin console is accessible at `http://localhost:9001` (default credentials: `minioadmin` / `minioadmin`).
