# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Structure

- **Backend**: Node.js/Express with Prisma ORM, PostgreSQL database
- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Testing**: Jest with jsdom for frontend integration tests

## Key Commands

### Backend
- `npm run dev` - Start development server with file watching
- `npm run start` - Start production server
- `npm run build` - Generate Prisma client

### Frontend
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:integration` - Run integration tests

### Database
- Prisma migrations are in `superadmin/backend/prisma/migrations/`
- Seed file: `superadmin/backend/prisma/seed.js`
- Schema: `superadmin/backend/prisma/schema.prisma`

## Code Style

### Backend
- ES modules with `.js` extensions
- ESLint rules: warn for unused vars, error for undefined
- Async/await pattern throughout
- Error handling with try/catch and next() for Express middleware

### Frontend
- TypeScript with strict typing
- ESLint config extends Next.js vitals and TypeScript rules
- Jest setup with jsdom environment, 30s timeout for integration tests
- Module name mapping: `@/` resolves to project root

## Architecture Patterns

### Backend
- MVC structure: models, controllers, routes
- Prisma ORM with PostgreSQL
- Express middleware for auth, rate limiting, validation
- Activity logging integrated into user actions

### Frontend
- App Router with nested layouts
- Provider pattern for global state (Auth, Theme, Loading, Network, Rate limiting)
- Component-based architecture with reusable UI components
- API layer in `lib/api.ts` with error handling

## Testing

- Integration tests in `superadmin/frontend/tests/integration.test.ts`
- Tests cover authentication, user management, modules, roles, and error handling
- Mock data used for activity logs and settings
- Test timeout: 30 seconds for integration tests

## Non-Obvious Patterns

- Backend uses ES modules but files have `.js` extensions (Node.js requirement)
- Frontend integration tests assume backend server running on localhost:4000
- Activity logs controller supports database-level pagination with Prisma skip/take
- Search functionality uses case-insensitive regex on action and details fields
- Date range filtering uses Prisma gte/lte operators on created_date
- IP address and user agent captured from Express req object in activity logging