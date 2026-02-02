-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AUTHOR', 'CUSTOMER');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "OverrideType" AS ENUM ('ADD', 'REMOVE');
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'ADMIN_EDITED');

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuthorProfile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "bio" TEXT,
  "defaultBufferBeforeMin" INTEGER NOT NULL DEFAULT 0,
  "defaultBufferAfterMin" INTEGER NOT NULL DEFAULT 0,
  "slotGranularityMin" INTEGER NOT NULL DEFAULT 15,
  "maxBookingsPerDay" INTEGER,
  CONSTRAINT "AuthorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "InterviewType" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "durationOptionsMin" INTEGER[] NOT NULL,
  "bufferBeforeMin" INTEGER NOT NULL,
  "bufferAfterMin" INTEGER NOT NULL,
  "minNoticeHours" INTEGER,
  "cancellationPolicyHours" INTEGER NOT NULL DEFAULT 24,
  "locationRequired" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "InterviewType_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AuthorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AvailabilityRule" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTimeLocal" TEXT NOT NULL,
  "endTimeLocal" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "AvailabilityRule_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AuthorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AvailabilityOverride" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "dateLocal" TEXT NOT NULL,
  "type" "OverrideType" NOT NULL,
  "startTimeLocal" TEXT,
  "endTimeLocal" TEXT,
  "note" TEXT,
  CONSTRAINT "AvailabilityOverride_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AuthorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "interviewTypeId" TEXT NOT NULL,
  "startAtUtc" TIMESTAMP(3) NOT NULL,
  "endAtUtc" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL,
  "customerTimezone" TEXT NOT NULL,
  "authorTimezone" TEXT NOT NULL,
  "locationText" TEXT,
  "meetingLink" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AuthorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Appointment_interviewTypeId_fkey" FOREIGN KEY ("interviewTypeId") REFERENCES "InterviewType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppointmentAudit" (
  "id" TEXT PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentAudit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationToken_token_key" UNIQUE ("token"),
  CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
);

CREATE INDEX "Appointment_authorId_startAtUtc_idx" ON "Appointment" ("authorId", "startAtUtc");
CREATE INDEX "Appointment_customerId_startAtUtc_idx" ON "Appointment" ("customerId", "startAtUtc");

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account" ("provider", "providerAccountId");

-- Prevent overlap for pending/confirmed appointments per author
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (
    "authorId" WITH =,
    tstzrange("startAtUtc", "endAtUtc", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
