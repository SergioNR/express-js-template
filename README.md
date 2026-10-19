# Express.js Template

Full-stack template: an Express.js backend API with a frontend placeholder.

## Layout

| Path | Contents |
| --- | --- |
| `backend/` | Express.js server — auth, billing, PostgreSQL/Prisma, Docker. See [backend/README.md](backend/README.md) |
| `frontend/` | Front-end application placeholder |

## Quick start

```bash
cd backend
cp .env.example .env
npm ci
docker compose up -d database
npx prisma migrate deploy
npm run start:local
```

## CI

GitHub Actions builds the backend Docker image from `backend/` and pushes it to Docker Hub on pushes to `latest` / `next`. Configure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as repository secrets.
