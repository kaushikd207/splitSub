# SplitSub

SplitSub is a subscription cost-sharing marketplace for plans whose provider terms explicitly allow member invitations. It never stores third-party credentials.

## Quick start

1. Copy `.env.example` to `apps/api/.env` and start dependencies with `docker compose up -d`.
2. Run `npm install`, then `npm run dev`.
3. Run `npm run prisma:generate -w @splitsub/api` and `npm run prisma:migrate -w @splitsub/api` before first API start.

## Architecture

- `apps/web`: React + Vite marketplace UI.
- `apps/api`: Express REST API, Prisma/PostgreSQL persistence, Redis reservation/rate-limit boundary, cookie JWT authentication.
- Payments are confirmed only from signed webhooks. Reservation finalization uses PostgreSQL row locks to prevent overselling.

## Production notes

Set secure secrets, configure a real payment adapter, SMTP, HTTPS, trusted reverse proxy, and provider eligibility policy before deployment. Run migrations as a release step; do not seed production credentials.
