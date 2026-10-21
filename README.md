# Full-Stack Template

Full-stack template: an Express.js backend API with a React (Vite + Mantine) SPA.

## Layout

| Path | Contents |
| --- | --- |
| `backend/` | Express.js server — auth, billing, PostgreSQL/Prisma, Docker. See [backend/README.md](backend/README.md) |
| `frontend/` | React SPA — public site, auth, user/admin areas. See [frontend/README.md](frontend/README.md) |

## Quick start

```bash
# Backend
cd backend
cp .env.example .env
npm ci
docker compose up -d database
npx prisma migrate deploy
npm run start:local

# Frontend (in a second terminal)
cd frontend
cp .env.example .env
npm ci
npm run start:local
```

## CI

GitHub Actions builds the backend Docker image from `backend/` and pushes it to Docker Hub on pushes to `latest` / `next`. Configure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as repository secrets.
