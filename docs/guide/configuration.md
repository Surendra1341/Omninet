# Configuration Reference

All services share a common `.env` file located at `omninet-microservices/.env`.  
A complete template is available at `omninet-microservices/.env.example`.

## Database

```dotenv
POSTGRES_USER=omninet
POSTGRES_PASSWORD=omninet123
POSTGRES_HOST=localhost        # or 'omninet-postgres' inside Docker

DB_AUTH_NAME=omninet_auth
DB_STORAGE_NAME=omninet_storage
DB_NOTES_NAME=omninet_notes
DB_AI_NAME=omninet_ai
```

## Redis

```dotenv
REDIS_HOST=localhost           # or 'omninet-redis' inside Docker
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Kafka

```dotenv
KAFKA_BOOTSTRAP_SERVERS=localhost:9092  # or 'omninet-kafka:9092' inside Docker
KAFKA_COMPRESSION_TYPE=none
```

## MinIO / S3

```dotenv
S3_ENDPOINT=http://localhost:9000       # internal endpoint
S3_PUBLIC_ENDPOINT=http://localhost:9000 # browser-accessible endpoint for presigned URLs
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=omninet
S3_REGION=us-east-1
```

## JWT

```dotenv
JWT_SECRET=your-256-bit-base64-secret
JWT_ACCESS_EXPIRATION=900000        # 15 minutes in ms
JWT_REFRESH_EXPIRATION=2592000000   # 30 days in ms
```

## OAuth2

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Email (OTP Registration)

```dotenv
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=
SPRING_MAIL_PASSWORD=
```

## AI / Gemini

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

## gRPC Ports

```dotenv
GRPC_AUTH_PORT=9091
GRPC_NOTES_PORT=9093
GRPC_AI_PORT=9094
GRPC_STORAGE_PORT=9095
```

## Port Summary

| Service | HTTP | gRPC |
|---------|------|------|
| API Gateway | 8080 | — |
| Auth Service | 8081 | 9091 |
| Storage Service | 8082 | 9095 |
| Notes Service | 8083 | 9093 |
| AI Service | 8084 | 9094 |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| Kafka | 9092 | — |
| MinIO API | 9000 | — |
| MinIO Console | 9001 | — |
| Frontend (Vite) | 5173 | — |

> [!WARNING]
> Never commit your `.env` file to version control. It is already listed in `.gitignore`.
