# Repo rules

Full-stack template monorepo: Express.js 5 API (`backend/`) + React/Vite/Mantine SPA (`frontend/`). Scoped rules in `backend/AGENTS.md` and `frontend/AGENTS.md` take precedence over this file within their directories.

## Layout

| Path | Contents |
| --- | --- |
| `backend/` | Express API — auth, billing, PostgreSQL/Prisma, Docker |
| `frontend/` | React SPA — public site, auth, user/admin areas |
| `.github/workflows/` | Docker build & push on `latest`/`next` |
| `.github/PULL_REQUEST_TEMPLATE/` | PR templates by change type |
| `.kilo/plans/` | Kilo plan history — do not hand-edit |

## Always

- Conventional Commits with scope: `feat(frontend): ...`, `fix(auth): ...`, `chore(deps): ...`, `feat(db)!` for breaking.
- Separate lockfiles per package — run `npm ci` inside `backend/` or `frontend/`, never at the root.
- Read the scoped `AGENTS.md` before changing a package.
- New environment variables: add to the package's `.env.example` and README table in the same change.
- Node 26+.

## Never

- Commit `.env` files or secrets.
- Edit `backend/server/config/generated/` (Prisma-generated, gitignored).
- Change `prisma/schema.prisma` without a migration.
- Push directly to `latest` or `next` — PR first (templates in `.github/PULL_REQUEST_TEMPLATE/`).

## Commands

| What | Where | Command |
| --- | --- | --- |
| Install | backend / frontend | `npm ci` |
| Run locally | backend | `npm run start:local` (needs `docker compose up -d database` + `npx prisma migrate deploy`) |
| Run locally | frontend | `npm run start:local` |
| Test | backend | `npm test` |
| Lint | backend / frontend | `npx eslint .` |
| Build | frontend | `npm run build` |
