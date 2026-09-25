# Docker Compose Deployment

OmniNet ships with two Docker Compose files for local deployment:

| File | Purpose |
|------|---------|
| `docker-compose.infra.yml` | Infrastructure only (Postgres, Redis, Kafka, MinIO) |
| `docker-compose.yml` | Full stack — all services + infrastructure |

## Full Stack Deploy

```bash
cd omninet-microservices
cp .env.example .env   # fill in secrets
docker compose up --build -d
```

### Verify All Services Are Up

```bash
docker compose ps
```

Expected status for all containers: `Up (healthy)` or `Up`.

| Container | Port | Status |
|-----------|------|--------|
| `omninet-api-gateway` | 8080 | Up |
| `omninet-auth-service` | 8081 | Up |
| `omninet-storage-service` | 8082 | Up |
| `omninet-notes-service` | 8083 | Up |
| `omninet-ai-service` | 8084 | Up |
| `omninet-postgres` | 5432 | Healthy |
| `omninet-redis` | 6379 | Healthy |
| `omninet-kafka` | 9092 | Up |
| `omninet-minio` | 9000, 9001 | Up |

## Build & Rebuild

Rebuild a single service without restarting others:

```bash
docker compose up --build -d auth-service
```

## View Logs

```bash
# All services
docker compose logs -f

# Single service
docker compose logs -f ai-service
```

## Stop & Clean Up

```bash
# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker compose down -v
```

## Infrastructure-Only Mode

Start only Postgres, Redis, Kafka, and MinIO for hybrid development:

```bash
docker compose -f docker-compose.infra.yml up -d
```

## Known Issues & Fixes

See the [Troubleshooting](/deployment/troubleshooting) page for a full list of resolved issues.

Key resolved issues:
- Storage gRPC port collision (`9092` → `9095` to avoid Kafka clash)
- Spring Security appearing on the API Gateway (exclusion added)
- Google OAuth2 redirect URI mismatch (`forward-headers-strategy: framework`)
- Snappy compression failing on Alpine musl libc (switched to `none`)
- Presigned URL using internal Docker hostname (split `s3Client` / `s3Presigner`)
- Spring Cloud Gateway 4.3.0 property prefix change (`spring.cloud.gateway.server.webflux`)
