# Production operations

## Stripe

Create a Stripe subscription price and set `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID`. Add a webhook endpoint at `https://fitflow-mern.onrender.com/api/payments/webhook`, subscribe to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`, then set its signing secret as `STRIPE_WEBHOOK_SECRET`. Never activate membership from a success redirect.

## Deployment and data

Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `APP_URL`, and email credentials in Render. Run `pnpm seed:classes` explicitly after the first deployment or when the curated class catalog changes. Run `pnpm seed:admin` once for the first administrator.

## Monitoring

Render logs are structured JSON and include request IDs. Configure an uptime monitor for `/api/health`; alert on non-200 responses or when the JSON status is not `ok`. Run `SMOKE_BASE_URL=https://fitflow-mern.onrender.com pnpm smoke` after deployments. Connect Render logs to the error-monitoring provider used by the team and alert on level `error` or `fatal`.

## GitHub protection

In GitHub, open Settings → Branches → Add branch protection rule for `main`. Require pull requests, require the `test-and-build` status check, require branches to be up to date, block force pushes, and require conversation resolution. Enable Dependabot security updates and secret scanning. These settings require repository-owner access and cannot be represented reliably by application code.

## Incident checklist

1. Check `/api/health` and Render service status.
2. Search logs using the response `requestId`.
3. Confirm MongoDB and third-party provider status.
4. Roll back to the last passing deployment if the incident began after a release.
5. Rotate affected secrets and document the root cause.
