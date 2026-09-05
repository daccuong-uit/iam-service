# IAM Service

IAM is one independent NestJS service. It owns authentication, users, profiles, sessions, MFA, roles, permissions, and one PostgreSQL boundary: `iam_db`.

## Start with Docker

Run from the Agent repository:

```powershell
docker compose up -d iam-postgres iam-service
docker compose logs -f iam-service
```

API base: `http://localhost:3001/api/v1`.
Health check: `http://localhost:3001/health`.

## Configuration

Copy `.env.example` to `.env` only when running this repository directly. Compose injects container values itself. Never commit `.env`.

## Development and release

The service has its own `package.json`, Prisma schema, Dockerfile, and Git repository. CI builds and publishes its image to GHCR on a push to `main`. A Git push does not restart an existing container; deploy the new image with `docker compose build iam-service` and `docker compose up -d iam-service`, or let Kubernetes roll out the new image.