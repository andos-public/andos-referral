# Andos Referral — Server (NestJS)

Phase 1 backend foundation for the referral service.

## Stack

NestJS 11 · TypeScript · Prisma · PostgreSQL · (Redis/BullMQ wired in a later sprint)

## Local setup

```bash
# 1. database + redis
docker compose up -d

# 2. environment
cp .env.example .env

# 3. install, migrate, run
npm install
npx prisma migrate dev
npm run start:dev
```

- API:     http://localhost:3000/v1
- Health:  http://localhost:3000/v1/health
- Swagger: http://localhost:3000/docs

## Layout

```
prisma/schema.prisma   Phase-1 data model (ported 1:1 from the approved draft DDL)
src/config/            environment validation (zod, fail-fast at boot)
src/prisma/            PrismaService (global module) + liveness probe
src/health/            /v1/health endpoint (reports DB connectivity)
```

## Conventions

- Money is always integer minor units (INR paise) — never floats.
- No secrets in the repo: `.env` is gitignored; `.env.example` shows shapes only.
- The initial SQL migration carries CHECK constraints and functional/partial indexes that
  Prisma cannot express — review migration SQL carefully in PRs; keep those constraints.
- Feature work planned next (Sprint 1, Invite Hub): referral-code create/list/deactivate,
  optional expiry, link events + per-link metrics API.
