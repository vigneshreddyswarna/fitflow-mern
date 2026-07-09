# FitFlow - MERN Fitness Consistency Platform

FitFlow is a full-stack fitness product that helps people build a routine they can sustain. Members can create an account, discover and book trainer-led classes, log workouts, and review their weekly activity.

## Project highlights

- Real MERN product flow: signup, email OTP verification, login, dashboard, class booking, workout logging, settings, and admin/trainer operations.
- Production-minded auth: JWT sessions, bcrypt password hashing, protected routes, role-based access, verified-email guards, and production-safe OTP responses.
- Class operations that go beyond CRUD: capacity checks, atomic booking for final spots, waitlists, cancellation, trainer ownership, and admin role management.
- Public trainer profile pages with specialties, bio, certifications, and assigned classes.
- AI Coach feature with graceful fallback: OpenAI can generate adaptive plans, but the rules engine still works without an API key.
- Portfolio polish: responsive React UI, PWA metadata, CI workflow, automated tests, security headers, rate limiting, and clean project structure.

## Why this project exists

Many fitness products focus on intense short-term plans. FitFlow focuses on repeatable habits: make a plan, show up, and see momentum grow. It upgrades the original static FitZone site into a real product with persistent user data.

## Features

- JWT authentication with bcrypt password hashing
- Protected member dashboard
- Filterable fitness class catalog
- Capacity-aware class booking with atomic final-spot updates
- Workout creation and deletion
- Seven-day activity visualization
- Per-user workout history and totals
- Responsive, accessible React interface
- MongoDB persistence through Mongoose
- Production build served by Express
- Adaptive AI Coach plans using goals, availability, workout history, and real classes
- Safe deterministic AI Coach fallback when no AI key is configured
- Admin and trainer role-based workspaces
- Real dated sessions, editing, cancellation, waitlists, trainer ownership, and automatic promotion
- Account settings for goals, training profile, trainer profile, and password updates
- Public trainer profiles and assigned class listings
- Email OTP verification, OTP password reset, and Google sign-in API support
- Stripe Checkout integration for memberships
- Automatic MET-based calorie estimates and detailed exercise/measurement models
- In-app notifications, email delivery, PWA installation, and offline frontend caching
- Helmet security headers, authentication rate limiting, and automated tests

## Tech stack

React, React Router, Recharts, Vite, Node.js, Express, MongoDB, Mongoose, JWT, and bcrypt.

Optional integrations use OpenAI, Stripe, Google Identity, EmailJS, and SMTP/Brevo. The AI Coach remains functional without those services.

## Run locally

1. Install [Node.js](https://nodejs.org/) and MongoDB locally, or create a free MongoDB Atlas database.
2. Copy `.env.example` to `.env`.
3. Put your MongoDB connection string and a long random JWT secret in `.env`.
4. Install dependencies and start both apps:

```bash
pnpm install
pnpm dev
```

The React app opens at `http://localhost:5173`; the API runs at `http://localhost:5000`.

If you prefer npm, the equivalent commands are:

```bash
npm install
npm run dev
```

Run automated tests with `pnpm test` and create a production build with `pnpm build`.

## Demo access

Create the admin account locally with:

```bash
pnpm seed:admin
```

Use the values you set in `.env` for `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Admin users can open **Manage**, promote members to trainers/admins, create classes, edit classes, and cancel classes. Trainers can open **Manage** and edit only their own assigned classes.

## Optional service configuration

- `OPENAI_API_KEY` and `OPENAI_MODEL`: enables generated adaptive plans. Without them, the safe rules engine creates plans.
- `SMTP_*` or `EMAILJS_*`: sends verification, reset, and booking emails. Brevo works with `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, the Brevo SMTP login, and the Brevo SMTP key. Without an email provider, messages are printed as local previews.
- `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID`: enables hosted membership checkout.
- `GOOGLE_CLIENT_ID`: enables the verified Google token endpoint.
- `APP_URL`: the frontend origin used in email and payment return links.
- `NODE_ENV=production`: required in deployment so OTP codes are never included in API responses.

Never expose these secrets through `VITE_` variables or commit `.env`.

Create the first administrator after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters):

```bash
pnpm seed:admin
```

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Restore a session |
| PATCH | `/api/auth/settings` | Update profile, trainer profile, or password |
| POST | `/api/auth/verify-email` | Verify signup OTP |
| POST | `/api/auth/forgot-password` | Send reset OTP |
| POST | `/api/auth/verify-reset-code` | Confirm reset OTP |
| POST | `/api/auth/reset-password` | Save a new password |
| GET | `/api/classes` | List and seed classes |
| GET | `/api/classes/stats/summary` | Public homepage stats |
| POST | `/api/classes/:id/book` | Book a class |
| GET | `/api/classes/mine/booked` | List the member's bookings |
| GET | `/api/trainers` | List public trainers |
| GET | `/api/trainers/:id` | View a trainer profile and assigned classes |
| GET/POST | `/api/workouts` | List or log workouts |
| DELETE | `/api/workouts/:id` | Remove a workout |
| GET/PATCH/DELETE | `/api/admin/classes` | Admin/trainer class operations |

## Deployment checklist

1. Push the project to GitHub.
2. Confirm GitHub Actions passes: `pnpm test` and `pnpm build`.
3. Deploy the API and frontend together on Render/Railway/Fly.io, or deploy the frontend on Vercel and the API separately.
4. Set production environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `APP_URL`, email provider credentials, and any optional Stripe/Google/OpenAI keys.
5. Run `pnpm seed:admin` once against the production database.
6. Add screenshots to the repository after deployment: home, classes, dashboard, AI coach, settings, and admin manage screen.

## Code organization

- `client/src/App.jsx`: route composition and page-level components.
- `client/src/ui.jsx`: reusable UI primitives such as icons, stats, empty states, skeletons, and confirmation modals.
- `client/src/auth-context.jsx`: shared authenticated user context.
- `server/routes/*`: feature-focused API modules for auth, classes, trainers, workouts, coach, admin, notifications, and payments.

## Resume description

**FitFlow - Full-stack fitness consistency platform**  
Built a responsive MERN application with JWT authentication, class discovery and capacity-aware booking, personalized workout tracking, and seven-day progress visualizations. Designed REST APIs with Express and modeled user-specific data relationships with MongoDB/Mongoose.
