# Deployment checklist

Deploy the web app as static assets and run the API behind HTTPS with a managed PostgreSQL and Redis instance. Configure `WEB_ORIGIN` for the frontend origin, `VITE_API_URL` for the frontend to reach the API, `DATABASE_URL`, `REDIS_URL`, a high-entropy `JWT_SECRET`, and `PAYMENT_WEBHOOK_SECRET` in the server environment. Set `NODE_ENV=production` so session cookies are `Secure`.

Run `prisma migrate deploy` during release. Put webhook handling behind the provider's signature validation, configure a real `PaymentService` adapter, and add scheduled expiration for stale reservations. Enable database backups, structured error reporting, and external rate limiting/WAF before accepting payments.

## Example environment variables (production)

Below are example values you provided. Set these in Railway (backend) and Vercel/Netlify (frontend) as appropriate.

- `DATABASE_URL`

	postgresql://postgres:ijBTJMRtnsSuKXLGheqFGyUpEiBAkurR@postgres.railway.internal:5432/railway

	- Set this in your Railway service (or provider-managed Postgres connection). Keep this secret.

- `WEB_ORIGIN`

	- Set to the exact frontend origin allowed to make authenticated requests:
		`https://split-sub-web.vercel.app`

- `VITE_API_URL`

	- The frontend build needs to know the API base URL. For example, set in Vercel environment variables:
		`VITE_API_URL=https://<your-railway-app>.up.railway.app`

Note: `WEB_ORIGIN` must exactly match the protocol and host of your deployed frontend (no trailing slash).

## Clearing demo client state

If users still see demo data after you deploy the live frontend, they likely have the demo seed in their browser localStorage. Ask users to run this in the browser console or include a short help snippet on the site:

```javascript
localStorage.removeItem('splitsub-demo-state-v1');
location.reload();
```

Alternatively, you can add a short migration step in the frontend that clears the demo key once a real `VITE_API_URL` is detected on initial load.
