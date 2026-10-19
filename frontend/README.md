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

Because the app is built with Vite, all variables must be provided as build-time `ARG`s when building the Docker image (see `Dockerfile`). An example list lives in `.env.example`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API |
| `VITE_PUBLIC_POSTHOG_KEY` | Optional PostHog project key. Analytics stay disabled when unset |
| `VITE_SITE_BASE_URL` | Public URL of the deployed frontend |

## Docker & deployment

The web app is packaged in a Docker image (nginx serving the built bundle, see `nginx.conf`).

A typical setup offloads image build and public deployment to a platform such as [Koyeb](https://koyeb.com): pushing or merging to the `next` and `latest` branches triggers a build with the `ARG`s above injected at build time, deploys the image and serves it through nginx. Configure the deployment and its environment variables in your platform of choice.
