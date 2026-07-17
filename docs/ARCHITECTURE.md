# FitFlow architecture

FitFlow is a single-service MERN application. Vite builds the React client into `client/dist`; Express serves that build and the `/api` routes from the same origin. MongoDB stores users, classes, workouts, plans, notifications, and measurements.

## Request flow

1. Helmet and CORS establish browser security policy.
2. Structured request logging assigns a request ID and redacts credentials.
3. Authentication reads the signed JWT from the secure `fitflow_session` HttpOnly cookie. Bearer tokens remain accepted for automated and service clients.
4. Verified-email and role middleware protect product and management routes.
5. Zod validates security-sensitive request bodies before business logic runs.
6. Mongoose validators and indexes enforce persistence constraints.

Stripe is the source of truth for billing. Only signed webhook events update membership state. Email is an asynchronous notification: a provider outage cannot roll back a successful booking.

## Reliability boundaries

- Demo data is seeded explicitly with `pnpm seed:classes`; public GET requests are read-only.
- `/api/health` returns HTTP 503 when MongoDB is unavailable.
- Production errors return a stable public message and request ID while detailed errors remain in structured logs.
- CI runs unit, integration, coverage, lint, audit, build, and browser smoke checks.
