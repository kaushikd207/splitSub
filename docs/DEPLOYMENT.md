# Deployment checklist

Deploy the web app as static assets and run the API behind HTTPS with a managed PostgreSQL and Redis instance. Configure `WEB_ORIGIN` for the frontend origin, `VITE_API_URL` for the frontend to reach the API, `DATABASE_URL`, `REDIS_URL`, a high-entropy `JWT_SECRET`, and `PAYMENT_WEBHOOK_SECRET` in the server environment. Set `NODE_ENV=production` so session cookies are `Secure`.

Run `prisma migrate deploy` during release. Put webhook handling behind the provider's signature validation, configure a real `PaymentService` adapter, and add scheduled expiration for stale reservations. Enable database backups, structured error reporting, and external rate limiting/WAF before accepting payments.
