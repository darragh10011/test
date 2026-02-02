# StoryKeeper Interview Scheduling MVP

Production-ready MVP for authors to publish interview availability and customers to book, reschedule, or cancel sessions.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind + shadcn/ui
- Prisma + PostgreSQL
- NextAuth (email magic link + Google optional)
- Luxon for timezone-safe scheduling
- Resend (or SMTP via nodemailer) for email

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env` file with:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/storykeeper
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
EMAIL_FROM=StoryKeeper <no-reply@storykeeper.test>
EMAIL_SERVER=smtp://user:pass@localhost:1025
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JOBS_SECRET=replace-me
```

### 3) Run migrations + seed
```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 4) Start dev server
```bash
npm run dev
```

## Core flows
- **Customer booking**: choose author → interview type + duration → pick slot → confirm.
- **Author settings**: update weekly availability and add overrides.
- **Admin dashboard**: filter appointments by author/date/status and open a booking.

## API Endpoints
- `GET /api/authors`
- `GET /api/authors/:id/interview-types`
- `GET /api/authors/:id/slots?typeId=...&duration=...&from=...&to=...&tz=...`
- `POST /api/appointments`
- `POST /api/appointments/:id/reschedule`
- `POST /api/appointments/:id/cancel`
- `POST /api/admin/appointments/:id/edit`
- `POST /api/jobs/send-reminders` (cron with `x-job-secret` header)

## Scheduling notes
- Availability is stored in the author timezone and converted to UTC for storage and booking.
- Slot generation respects weekly rules, overrides, buffers, minimum notice, and existing bookings.
- Database-level exclusion constraint prevents double booking for pending/confirmed appointments.

## Testing
```bash
npm run test
```
