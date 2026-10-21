# Express.js Server Template

A production-ready Express.js backend template with authentication, billing, and database integrations out of the box.

## Features

- **Authentication** — Passport.js local strategy with session-based auth (stored in PostgreSQL), password reset flow via email tokens, and role-based access control (`user` / `admin`)
- **Team management** — company member invites (single-use email tokens), member removal and role changes
- **Database** — PostgreSQL with Prisma ORM, migrations, and a Prisma-backed session store
- **Billing** — Stripe subscriptions (checkout sessions, customer portal, webhook handling)
- **Email** — Brevo transactional emails
- **File uploads** — S3-compatible storage (AWS S3 or MinIO) via presigned URLs; optional feature, enabled when `S3_BUCKET` is set
- **Analytics** — PostHog product analytics
- **Logging** — Pino structured logs with Telegram notifications
- **Security** — Helmet, CORS, rate limiting, request throttling, input validation (express-validator), bcrypt password hashing
- **Scheduled jobs** — cron-based cleanup (expired password reset tokens)
- **Docker** — dev and production images, Docker Compose for local services

## Requirements

- Node.js 26.x
- Docker (for the database, or provide your own PostgreSQL)

## Getting started

1. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Start the database and apply migrations:

   ```bash
   docker compose up -d database
   npx prisma migrate deploy
   ```

4. Start the server:

   ```bash
   npm run start:local
   ```

Or run everything through Docker (auto-rebuilds on code changes):

```bash
npm run start:docker
```

## File storage (S3-compatible)

The `/api/v1/files` endpoints run against any S3-compatible provider (AWS S3, MinIO, ...) using presigned URLs: the API registers the file and hands out a short-lived upload URL, the client puts the bytes straight into the bucket, and downloads fetch a fresh presigned URL per request. The feature is off until `S3_BUCKET` is set — the server boots normally either way.

Uploads are constrained at request time by `S3_MAX_FILE_SIZE_MB` and `S3_ALLOWED_MIME_TYPES`; roles govern who can use the endpoints via the seeded `files.view` / `files.upload` / `files.delete` company permissions (`company_member` gets view + upload, `company_owner`/`company_admin` get all three).

Bring your own bucket for local development. The fastest way is a throwaway MinIO:

```bash
docker run --name template-minio -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
```

Create the bucket (root user `minioadmin` / `minioadmin`, via the console at http://localhost:9001 or the `mc` CLI):

```bash
docker run --rm --network host minio/mc sh -c "mc alias set local http://localhost:9000 minioadmin minioadmin && mc mb local/template-files"
```

Then fill the `S3_*` block in `.env`:

```bash
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=template-files
S3_FORCE_PATH_STYLE=true
```

For AWS, leave `S3_ENDPOINT` empty and point `S3_REGION`/credentials/bucket at your account (`S3_FORCE_PATH_STYLE=false` if you prefer virtual-hosted addressing). Bucket credentials must allow `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject` on the bucket's objects.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the server |
| `npm run start:local` | Start locally with `--watch` using the `.env` file |
| `npm run start:docker` | Start via Docker Compose |
| `npm run stripe:listen` | Forward Stripe webhooks to localhost for testing |
| `npm test` | Run the test suite (Jest) |

## Environment variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Express session secret |
| `PRISMA_POSTGRES_DIRECT_URL` / `PRISMA_POSTGRES_CONNECTION_STRING` | PostgreSQL connection strings |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Docker Compose database credentials |
| `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` | Stripe billing configuration |
| `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | S3-compatible file storage. The whole files feature is an **optional feature flag**: when `S3_BUCKET` is unset the server boots normally and `/api/v1/files` is not mounted. `S3_ENDPOINT` targets a non-AWS provider (e.g. MinIO, `http://localhost:9000`); `S3_FORCE_PATH_STYLE` (default `true`) is required for MinIO. `S3_MAX_FILE_SIZE_MB` (default `50`) and `S3_ALLOWED_MIME_TYPES` (comma-separated whitelist with a sensible default) constrain uploads at request time |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_ACCOUNT_EXISTS_TEMPLATE_ID` | Transactional email configuration; template id for the duplicate-registration notice (optional - notice is skipped when unset) |
| `POSTHOG_API_KEY` | Product analytics |
| `TELEGRAM_BOT_API_KEY` / `TELEGRAM_INFO_CHAT_ID` / `TELEGRAM_ERRORS_CHAT_ID` | Telegram log notifications |
| `FRONT_WEB_APP_ORIGIN_URL` | Front-end origin (CORS + Stripe redirects) |

## API overview

All routes are versioned under `/api/v1`. Interactive documentation is served by Swagger UI at [`/api/docs`](http://localhost:3000/api/docs) (raw OpenAPI spec at `/api/docs.json`), generated at server start from the `@openapi` JSDoc annotations declared next to each route definition.

| Area | Endpoints |
| --- | --- |
| Health | `GET /` |
| Docs | `GET /api/docs` (Swagger UI), `GET /api/docs.json` (OpenAPI spec) |
| Auth | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/session`, password reset (`GET/POST/PATCH /api/v1/auth/password-reset`), `PATCH /api/v1/auth/update-user-password`, team invites (`GET /api/v1/auth/invite`, `POST /api/v1/auth/invite-accept`) |
| User | `GET /api/v1/user`, `DELETE /api/v1/user` |
| Billing | `GET/POST /api/v1/billing`, `POST /api/v1/billing/checkout-session`, `POST /api/v1/billing/customer-portal` |
| Files | `POST /api/v1/files` (register + presigned upload URL), `GET /api/v1/files` (cursor-paginated list), `GET /api/v1/files/:fileId/download` (presigned download URL), `DELETE /api/v1/files/:fileId` — only mounted when `S3_BUCKET` is set |
| Team | `GET /api/v1/team`, `POST /api/v1/team/invites`, `POST /api/v1/team/invites/:inviteId/resend`, `DELETE /api/v1/team/invites/:inviteId`, `DELETE/PATCH /api/v1/team/members/:userId` |
| Admin | `GET /api/v1/admin/users`, `GET /api/v1/admin/users/:userId`, `DELETE /api/v1/admin/users/:userId`, `GET /api/v1/admin/companies`, `GET /api/v1/admin/companies/:companyId`, `GET /api/v1/admin/stats` |
| Webhooks | `POST /webhooks/v1/stripe` |

## Architecture

```
server/
├── API/v1/routes/     # Route definitions per resource
├── controllers/       # Request handlers
├── models/            # Prisma data-access layer
├── middlewares/       # Auth, RBAC, CORS, rate limits, error handler
├── auth/              # Passport strategies
├── integrations/      # Stripe, Brevo, Telegram, S3
├── config/            # Logger, Stripe, PostHog, S3, Prisma client
├── cron/              # Scheduled jobs
└── webhooks/          # Stripe webhook processing
```

MVC + repository pattern: controllers handle requests, models encapsulate all database operations.

## Deployment

The included GitHub Actions workflow (`.github/workflows/`) builds the Docker image and pushes it to Docker Hub on pushes to `latest` / `next` branches. Set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as repository secrets and adapt the image name to your registry.

## Stripe webhook testing

```bash
npm run stripe:listen
```

Forwards Stripe events from your test account to `http://localhost:3000/webhooks/v1/stripe`.
