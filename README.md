# DAVCreations Superadmin Platform

Superadmin control plane for the DAVCreations white-label platform: an Express 5
REST API (Prisma + PostgreSQL) and a Next.js admin panel for user, role,
module-access, and OTP management.

## Why

White-label platforms multiply quickly — every client gets a branded surface,
but the control plane underneath should be one shared, hardened system. This
repo is that control plane: a superadmin backend that centralizes user
management, user-types and roles, module assignment (what each tenant can see),
activity logs, and OTP/session handling, plus the Next.js panel that
administrators actually use day to day. Every admin route is rate-limited,
Zod-validated, and gated by a JWT auth + role middleware chain
(`isOwner` / `isAdmin` / `isAdminOrManager`), so permission boundaries are
enforced in one place instead of leaving each endpoint to guess. Emails flow
through Resend, sessions and OTPs are persisted in PostgreSQL via Prisma, and
the whole backend runs cleanly behind PM2 or Docker.

## Features

- **JWT authentication & authorization** — `CheckAuth` middleware with role
  guards (`isOwner`, `isAdmin`, `isAdminOrManager`) on every admin route
- **User management** — create, update, soft-delete, and recover users with
  Zod-validated request schemas
- **Role & user-type management** — CRUD for user types with owner-only transfer
- **Module access control** — assign/unassign modules to users, list a user's
  modules, deactivate modules
- **OTP & session persistence** — OTP, session, and user-access models in Prisma
  with Resend email delivery (`services/sendOtpService.js`)
- **Rate limiting** — general + per-route (`adminLimiter`) Express rate limits
- **Input validation** — Zod schemas via `validateRequest` middleware
- **Activity logging** — user and admin activity captured for audit
- **Next.js admin panel** — App Router pages for login, users, user-types,
  roles/permissions, modules, activity logs, and settings
- **Production hardening** — cookie-signed sessions (`MYSECRET`), CORS origin
  allowlist, and eslint config

## Quickstart

### Backend

Requirements: Node.js 18+, PostgreSQL.

```bash
cd superadmin/devcreations-backend
cp env.example .env        # set DATABASE_URL, MYSECRET, RESEND_API_KEY, ...
npm install
npm run build              # generate the Prisma client
npm run dev                # dev server with watching (default port 4000)
npm run start              # production server
```

`env.example` keys: `DATABASE_URL`, `MYSECRET`, `PORT`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `CORS_ORIGINS`.

### Frontend

```bash
cd superadmin/frontend
npm install
npm run dev                # Next.js dev server
npm run build && npm run start
npm run lint
npm test                   # Jest integration tests
```

## Project structure

- `superadmin/devcreations-backend/` — Express 5 API (`app.js`), routes/
  (`userRoutes`, `adminRoutes`), controllers/, middlewares/ (auth, rate limit,
  validation, credentials), models/, services/, `prisma/schema.prisma`
- `superadmin/frontend/` — Next.js App Router panel (login, users, user-types,
  roles-permissions, manage-modules, activity-logs, settings) with integration
  and hardening docs in `*.md`

## Documentation

The frontend ships operational docs: `INTEGRATION_GUIDE.md`,
`PHASE3_PRODUCTION_HARDENING.md`, `LOGIN_SECURITY_GUIDE.md`,
`BASEPATH_FIX.md`, `FORGOT_PASSWORD_COMPLETE.md`, and
`FRONTEND_IMPROVEMENTS.md`.

## Contributing

Fork, create a feature branch, and open a pull request. Keep auth and
validation middleware central — do not bypass them per route.

## License

License not yet specified — contact the maintainer before reusing the codebase.