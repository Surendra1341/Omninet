# Docker Swarm (Production)

OmniNet includes a `docker-stack.yml` for production-grade deployment using **Docker Swarm**.

## Initialize Swarm

```bash
docker swarm init
```

## Deploy the Stack

```bash
cd omninet-microservices
docker stack deploy -c docker-stack.yml omninet
```

## Monitor Services

```bash
# List all services and replica counts
docker stack services omninet

# View logs for a service
docker service logs omninet_api-gateway
docker service logs omninet_ai-service --follow

# Check task (container) status
docker service ps omninet_auth-service
```

## Scale Services

```bash
# Scale AI service to 2 replicas
docker service scale omninet_ai-service=2
```

## Update a Service (Rolling Deploy)

```bash
docker service update \
  --image ghcr.io/surendra1341/omninet-ai-service:latest \
  omninet_ai-service
```

## Remove the Stack

```bash
docker stack rm omninet
```

## Production Recommendations

| Concern | Recommendation |
|---------|---------------|
| Secrets | Use Docker Secrets instead of `.env` |
| TLS | Add Traefik or nginx as a reverse proxy with Let's Encrypt |
| Monitoring | Add Prometheus + Grafana for service metrics |
| Logging | Ship logs to ELK stack or Loki |
| Backups | Enable automated PostgreSQL and MinIO backups |
| Replicas | Run 2+ replicas of stateless services (gateway, notes, ai) |
| Healthchecks | All services expose `/actuator/health` |
