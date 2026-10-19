# Express.js Server Template

A production-ready Express.js backend template with authentication, billing, and database integrations out of the box.

## Features

- **Authentication** — Passport.js local strategy with session-based auth (stored in PostgreSQL), password reset flow via email tokens, and role-based access control (`user` / `admin`)
- **Database** — PostgreSQL with Prisma ORM, migrations, and a Prisma-backed session store
- **Billing** — Stripe subscriptions (checkout sessions, customer portal, webhook handling)
- **Email** — Brevo transactional emails
- **Analytics** — PostHog product analytics
- **Logging** — Pino structured logs with Telegram notifications
- **Security** — Helmet, CORS, rate limiting, request throttling, input validation (express-validator), bcrypt password hashing
- **Scheduled jobs** — cron-based cleanup (expired password reset tokens)
- **Docker** — dev and production images, Docker Compose for local services

## Requirements

- Node.js 24.x
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
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` | Transactional email configuration |
| `POSTHOG_API_KEY` | Product analytics |
| `TELEGRAM_BOT_API_KEY` / `TELEGRAM_INFO_CHAT_ID` / `TELEGRAM_ERRORS_CHAT_ID` | Telegram log notifications |
| `FRONT_WEB_APP_ORIGIN_URL` | Front-end origin (CORS + Stripe redirects) |

## API overview

All routes are versioned under `/api/v1`. Full documentation lives in `swagger.yaml`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /` |
| Auth | `POST /api/v1/auth/login/local`, `POST /api/v1/auth/register/local/user`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/session`, password reset (`GET/POST/PATCH /api/v1/auth/password-reset`), `PATCH /api/v1/auth/update-user-password` |
| User | `GET /api/v1/user`, `DELETE /api/v1/user` |
| Billing | `GET/POST /api/v1/billing`, `POST /api/v1/billing/checkout-session`, `POST /api/v1/billing/customer-portal` |
| Admin | `GET /api/v1/admin`, `GET /api/v1/admin/:userId`, `DELETE /api/v1/admin/:userId` |
| Webhooks | `POST /webhooks/v1/stripe` |

## Architecture

```
server/
├── API/v1/routes/     # Route definitions per resource
├── controllers/       # Request handlers
├── models/            # Prisma data-access layer
├── middlewares/       # Auth, RBAC, CORS, rate limits, error handler
├── auth/              # Passport strategies
├── integrations/      # Stripe, Brevo, Telegram
├── config/            # Logger, Stripe, PostHog, Prisma client
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
