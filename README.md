# Smart Appointment Booking System

A full-stack appointment booking app with two seeded providers, dynamic availability, booking, cancellation, and an appointment management view. Appointment times are stored in PostgreSQL and scheduled in India Standard Time (Asia/Kolkata).

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL or Neon PostgreSQL

## Set up locally

1. Install dependencies with `npm install`. The postinstall hook generates the Prisma client and does not connect to the database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the runtime connection string and `DIRECT_URL` to the direct connection string. For local PostgreSQL, set both to your local database URL.
3. Apply the checked-in migrations with `npm run db:deploy`.
4. Seed the two service providers with `npm run db:seed`.
5. Start the development server with `npm run dev`, then open <http://localhost:3000>.

`npm run db:migrate` creates a migration during local schema development. Use `npm run db:deploy` to deploy checked-in migrations.

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL connection, usually pooled |
| `DIRECT_URL` | Direct PostgreSQL connection for migrations |

Keep `.env` and `.env.test` private. The example files contain placeholders only.

## Architecture and API

The Next.js App Router in `app/` provides pages and API routes. Reusable UI, validation, scheduling, and appointment business logic live under `src/`. PostgreSQL access, schema, seed data, and migrations use Prisma under `prisma/`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/providers` | List the two configured providers |
| `GET` | `/api/providers/:id/slots?date=YYYY-MM-DD` | Calculate availability from working hours and existing bookings |
| `POST` | `/api/appointments` | Validate and create a booking |
| `GET` | `/api/appointments` | List all bookings for the management view |
| `GET` | `/api/appointments/:id` | Look up details by UUID or human-friendly visit reference |
| `POST` | `/api/appointments/:id/cancel` | Cancel a booked appointment without deleting its record |

The schedule is fixed: Monday through Saturday, 10:00 AM to 6:00 PM, with 30-minute slots in Asia/Kolkata. Appointment status is `BOOKED` or `CANCELLED`. A partial unique database index prevents two active bookings for the same provider and start time while allowing cancelled slots to be rebooked. The visit reference (for example, `VIS-7K2M-4Q9R`) is the human-friendly booking ID; the UUID remains the internal database ID. The management page displays all appointments, as required by the assessment. API errors use `{ "error": { "code": "...", "message": "..." } }`.

## Tests and checks

`npm run lint` runs ESLint. `npm run build` creates the production build. `npm test` runs Vitest, including database-backed API integration tests. Those integration tests delete appointment rows and create fixture data, so they must use a separate disposable test database.

For the test database, copy `.env.test.example` to `.env.test`, set it to a separate database, then run:

```sh
npm run db:migrate:test
npm test
```

Never point `.env.test` at a production or shared development database. Slot tests also cover the IST midnight boundary.

## Known limitations

- There is no authentication, email/SMS confirmation, rate limiting, provider administration, pagination, or configurable booking horizon.
- The management view is intentionally public and lists all appointments to match the assessment requirements.
- Availability and booking depend on a reachable PostgreSQL database. A sleeping or unavailable hosted database can make requests slow or return a server error.

## AI usage summary

OpenAI Codex was used to help translate the assessment into implementation tasks, update the booking flow and APIs, troubleshoot framework and database errors, and review the code. The developer supplied project context and reviewed the resulting changes. API behavior was previously exercised through Postman; database-backed integration tests should be run against an isolated test database before submission.
