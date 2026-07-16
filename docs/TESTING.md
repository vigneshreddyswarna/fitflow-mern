# Testing strategy

- `pnpm test`: fast API, security, service, and component tests.
- `pnpm test:coverage`: enforces minimum line, function, statement, and branch coverage.
- `INTEGRATION_MONGODB_URI=... pnpm test`: enables database-backed authentication, booking, waitlist, admin, and attendance flows.
- `pnpm test:e2e`: Playwright keyboard and public-user browser flows.
- `pnpm lint`: static JavaScript and JSX checks.
- `pnpm audit --prod --audit-level high`: blocks known high-severity production dependency issues.
- `pnpm build`: verifies the deployable frontend bundle.
- `pnpm smoke`: checks the deployed homepage and database-aware health endpoint.

GitHub Actions runs the complete suite with an isolated MongoDB service. New critical workflows should include an integration test and, when user-visible, an end-to-end test.
