# Frontend rules — React SPA

Rules describe how this codebase is written today. Follow them for all new and modified code.

## Stack & runtime

- React 19 + Vite 7 + Mantine 8, `react-router` 7, axios, optional PostHog. Plain JSX (no TypeScript).
- Node 24 (`engines.node`). ESLint 9 flat config (`eslint.config.js`): js recommended + react + react-hooks + react-refresh. Run `npx eslint .` from `frontend/`.
- 2-space indent for new files, single quotes, semicolons (match the majority of `src/`).

## Structure

- `src/pages/<area>/` — one folder per area: `index/` (public site), `auth/`, `user/`, `admin/`. Each area has a `*Wrapper.jsx` layout component.
- `src/components/partials/` — navbars/footers; `src/components/auth/` — forms; `src/components/navBarElements/` — navbar action buttons.
- `src/contexts/` — React contexts (server state). `src/config/` — `API/axiosConfig.mjs` and `plans.js`.
- Components export both named and default (`export function LoginForm` + `export default LoginForm`).

## Routing & guards

- Single route tree in `src/main.jsx` — add new pages there, colocated with their area wrapper.
- Area wrappers own session guarding: call `GET /api/v1/auth/session`; on failure `navigate('/auth/login')`; render `<Outlet />` only after the check (`UserWrapper.jsx` is the reference).
- Post-login routing by role: `admin` → `/admin`, `user` → `/dashboard`.

## API access

- All requests go through the shared `apiClient` (`src/config/API/axiosConfig.mjs`): `withCredentials`, 10s timeout, `VITE_API_BASE_URL` base. Never use `fetch` directly, never create other axios instances.
- Paths always include the version prefix (`/api/v1/...`).
- Handle API errors by status with user-facing Spanish messages (see `LoginForm.jsx`).

## UI conventions

- Mantine components + `@tabler/icons-react` icons only. Page-specific styles in colocated `*.module.css`.
- Forms: uncontrolled inputs with `name` attributes, read via `e.target.<name>` in `onSubmit`; surface API errors with Mantine `Alert`.
- UI copy is Spanish; code, identifiers, and comments are English.
- Server state pattern: context provider + `useX()` hook + `refresh` function (`SubscriptionContext.jsx` is the reference). No global state library.

## Environment & build

- Vite vars are `VITE_*`, baked at build time (Docker `ARG`s). New vars must be added to `.env.example` and the README table.
- Prod bundle: `vite build` → `dist/`, served by nginx (`nginx.conf`, SPA history fallback). Image builds via the `docker-build:*` scripts.
- No test framework yet — do not invent one without discussion.
