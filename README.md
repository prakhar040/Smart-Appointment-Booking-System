# Smart Appointment Booking System

A small appointment scheduling app for a provider directory, live slot availability, booking, lookup, and cancellation. The app uses IST by default and stores appointment instants in PostgreSQL.

## Requirements

- Node.js 20.9 or newer (required by the installed Next.js version)
- npm
- PostgreSQL, or a Neon PostgreSQL database

Docker is not part of this project. Neon is the documented hosted database option.

## Set up locally

1. Install dependencies with `npm install`. The postinstall hook generates the Prisma client. It supplies local placeholder URLs only for generation when database variables are absent; it does not connect to a database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the pooled connection string and `DIRECT_URL` to the direct connection string from your PostgreSQL provider. Set both to a local database URL when using local PostgreSQL.
3. Review the scheduling settings in `.env`. Defaults are `Asia/Kolkata`, 10:00–18:00, 30-minute slots, Monday through Saturday.
4. Apply schema migrations with `npm run db:deploy`.
5. Seed the sample providers with `npm run db:seed`.
6. Start the development server with `npm run dev`, then open <http://localhost:3000>.

For a new local schema during development, `npm run db:migrate` creates and applies a migration. Use `npm run db:deploy` for a clean deployment from checked-in migrations.

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime/pooled PostgreSQL connection used by Prisma |
| `DIRECT_URL` | Direct database connection for Prisma migrations |
| `TIMEZONE` | Scheduling calendar zone; defaults to `Asia/Kolkata` |
| `WORK_START_HOUR` | Opening hour, defaults to `10` |
| `WORK_END_HOUR` | Closing hour, defaults to `18` |
| `SLOT_MINUTES` | Appointment length, defaults to `30` |
| `WORKING_DAYS` | Luxon weekday numbers, Monday `1` through Sunday `7`; defaults to `1,2,3,4,5,6` |

Keep `.env` and `.env.test` private. `.env.example` and `.env.test.example` contain placeholders only.

## Application and API

The active Next.js App Router is the root `app/` directory. Reusable booking logic and UI live under `src/`; Prisma schema, seed, and migrations live under `prisma/`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/providers` | List providers |
| `GET` | `/api/providers/:id/slots?date=YYYY-MM-DD` | List provider availability for a date |
| `POST` | `/api/appointments` | Create a booking |
| `GET` | `/api/appointments/:id` | Look up an appointment |
| `POST` | `/api/appointments/:id/cancel` | Cancel an appointment |

Booking requests require `providerId`, `customerName`, `customerEmail`, and an ISO 8601 `startTime` with a timezone offset. API errors use `{ "error": { "code": "...", "message": "..." } }`. The database's partial unique index prevents two active bookings for the same provider and start time, including concurrent requests.

## Tests and checks

`npm run lint` runs ESLint. `npm run build` creates the production build. `npm test` runs Vitest, including database-backed API integration tests. Those integration tests delete appointment rows and create fixture providers, so they must use a separate disposable test database.

To configure that database, copy `.env.test.example` to `.env.test`, use credentials for a separate test database, then run:

```sh
npm run db:migrate:test
npm test
```

Do not point `.env.test` at a production or shared development database. `src/lib/slots.test.ts` also covers the IST midnight boundary: 00:00 IST belongs to the new calendar date, even though it is still the prior UTC date.

## Known limitations

- There is no authentication or authorization. Booking lookup and cancellation rely on an appointment ID, so this is a demonstration project and should not be exposed as a production service without access controls.
- There is no email/SMS confirmation, rate limiting, provider administration, pagination, or configurable booking horizon.
- Availability and booking depend on a reachable PostgreSQL database. A sleeping or unavailable hosted database can make requests slow or return a server error until the database wakes or connectivity is restored.
- Production concurrency, cold-start, reload, and manual abuse checks require a configured reachable database and deployment environment; they are not implied by the automated unit tests.

## AI usage and verification notes

OpenAI Codex was used to help plan and implement the application, review code, troubleshoot Next.js and database errors, and improve the booking UI. The developer also tested API requests in Postman and supplied the observed responses and logs. Codex helped add the API and slot test cases and performed local static/build checks when available.

The supplied Postman logs showed the API route returning errors when the configured Neon host could not be reached. Database-backed integration tests and production concurrency/cold-start checks must be run against a reachable, isolated database and deployment before claiming those behaviors are verified. No external production database or deployment was modified as part of this implementation.
