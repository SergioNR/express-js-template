# Frontend Template

React single-page application built with Vite and Mantine. It ships with:

- **Public site** — landing page, pricing, FAQ and terms pages with placeholder content
- **Authentication** — login, registration and password reset/recovery flows
- **User area** — dashboard, profile and Stripe billing (checkout + customer portal)
- **Admin area** — user management dashboard
- **Analytics** — optional PostHog product analytics, enabled when a key is configured

## Getting started

```bash
npm ci
npm run start:local
```

The app expects the backend API to be running (see `../backend/README.md`). Copy `.env.example` to `.env` and adjust the values as needed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:local` | Start the Vite dev server locally |
| `npm run build` | Build the production bundle (`dist/`) |
| `npm run docker-build:local` | Build a local Docker image |
| `npm run docker-build:prod` | Build and push the `latest` Docker image |
| `npm run docker-build:dev` | Build and push the `next` Docker image |

Adapt the image names in these scripts to your own Docker registry.

## Environment variables

Because the app is built with Vite, all `VITE_*` variables are baked in at build time and must be provided as `--build-arg`s when building the Docker image (see `Dockerfile`). The `docker-build:prod`/`docker-build:dev` scripts forward them from your shell environment (`export VITE_API_BASE_URL=...` first); the image build fails if a required one is missing. An example list lives in `.env.example`.

| Variable | When | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Build (required in Docker) | Base URL of the backend API |
| `VITE_PUBLIC_POSTHOG_KEY` | Build (optional) | PostHog project key. Analytics stay disabled when unset |
| `VITE_SITE_BASE_URL` | Build (required for `npm run build`) | Public URL of the deployed frontend (canonical / `og:url`). The dev server defaults to `http://localhost:5173` |
| `NGINX_CSP_API_ORIGIN` | Container runtime (optional) | API origin allowed in the CSP `connect-src`. Defaults to the `VITE_API_BASE_URL` build arg; override with `docker run -e NGINX_CSP_API_ORIGIN=https://api.example.com` |
| `NGINX_CSP_CONNECT_EXTRA` | Container runtime (optional) | Space-separated extra origins allowed in the CSP `connect-src` — e.g. the S3/MinIO origin that presigned file uploads/downloads go to. Defaults to empty |

## Docker & deployment

The web app is packaged in a Docker image: an unprivileged nginx (`nginxinc/nginx-unprivileged`, runs as non-root) serving the built bundle on **port 8080**. The server config lives in `nginx/*.template` and is rendered with `envsubst` at container start (SPA history fallback, security headers incl. CSP, `no-cache` for `index.html`, immutable caching for `/assets/`, gzip).

`npm run docker-build:local` builds the image locally; run it with `docker run --rm -p 8080:8080 expressjs-template-front:local` and open http://localhost:8080. `docker-build:prod` and `docker-build:dev` build and push the `latest` and `next` tags to Docker Hub; adapt the image names in these scripts to your own registry.
