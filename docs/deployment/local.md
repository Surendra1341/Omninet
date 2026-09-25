# Local Development

This guide walks you through running OmniNet locally in hybrid mode (infrastructure in Docker, services in your IDE).

## Prerequisites

- **Java 21** (via SDKMAN: `sdk install java 21-tem`)
- **Maven 3.9** (or use the included `mvnw` wrapper)
- **Node.js 18+** and **npm 9+**
- **Docker 24+** and **Docker Compose v2**

## Step 1 — Start Infrastructure

```bash
cd omninet-microservices
cp .env.example .env   # fill in your secrets
docker compose -f docker-compose.infra.yml up -d
```

This starts:
- PostgreSQL `:5432` (with 4 auto-created databases)
- Redis `:6379`
- Kafka `:9092` (KRaft mode)
- MinIO `:9000` (console `:9001`)

## Step 2 — Build Maven Modules

```bash
cd omninet-microservices
./mvnw clean install -DskipTests
```

Or if using system Maven:

```bash
mvn clean install -DskipTests
```

## Step 3 — Run Services

Open 5 terminals (or use IntelliJ's Run Configurations):

```bash
# Terminal 1 — API Gateway
cd omninet-microservices/api-gateway
../mvnw spring-boot:run

# Terminal 2 — Auth Service
cd omninet-microservices/auth-service
../mvnw spring-boot:run

# Terminal 3 — Storage Service
cd omninet-microservices/storage-service
../mvnw spring-boot:run

# Terminal 4 — Notes Service
cd omninet-microservices/notes-service
../mvnw spring-boot:run

# Terminal 5 — AI Service
cd omninet-microservices/ai-service
../mvnw spring-boot:run
```

## Step 4 — Start Frontend

```bash
cd omninet-security-web
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8080
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Step 5 — Verify

```bash
# Health checks
curl http://localhost:8080/actuator/health   # API Gateway

# Test auth (replace TOKEN with a valid JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/v1/auth/user
```

## DNS / IPv4 Fix (If Gemini Times Out)

If the AI service fails to connect to the Gemini API, add this JVM flag:

```bash
# In ai-service/src/main/resources/application.yml
spring:
  application:
    name: ai-service
# OR set JAVA_OPTS before running:
export JAVA_OPTS="-Djava.net.preferIPv4Stack=true"
```
