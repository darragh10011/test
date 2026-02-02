import { PrismaClient, Role, OverrideType, AppointmentStatus, AuditAction } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

async function main() {
  await prisma.appointmentAudit.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilityOverride.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.interviewType.deleteMany();
  await prisma.authorProfile.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@storykeeper.test",
      role: Role.ADMIN,
      timezone: "America/New_York"
    }
  });

  const authorOne = await prisma.user.create({
    data: {
      name: "Olivia Author",
      email: "olivia@author.test",
      role: Role.AUTHOR,
      timezone: "America/Los_Angeles",
      authorProfile: {
        create: {
          bio: "Writes about legacy and family traditions.",
          defaultBufferBeforeMin: 10,
          defaultBufferAfterMin: 10,
          slotGranularityMin: 15,
          maxBookingsPerDay: 4
        }
      }
    },
    include: { authorProfile: true }
  });

  const authorTwo = await prisma.user.create({
    data: {
      name: "Marcus Author",
      email: "marcus@author.test",
      role: Role.AUTHOR,
      timezone: "America/Chicago",
      authorProfile: {
        create: {
          bio: "Focuses on memoir interviews for entrepreneurs.",
          defaultBufferBeforeMin: 5,
          defaultBufferAfterMin: 15,
          slotGranularityMin: 20,
          maxBookingsPerDay: 3
        }
      }
    },
    include: { authorProfile: true }
  });

  const customers = await prisma.user.createMany({
    data: [
      {
        name: "Chloe Customer",
        email: "chloe@storykeeper.test",
        role: Role.CUSTOMER,
        timezone: "America/New_York"
      },
      {
        name: "Diego Customer",
        email: "diego@storykeeper.test",
        role: Role.CUSTOMER,
        timezone: "Europe/London"
      },
      {
        name: "Priya Customer",
        email: "priya@storykeeper.test",
        role: Role.CUSTOMER,
        timezone: "Asia/Kolkata"
      }
    ]
  });

  const authorOneProfile = authorOne.authorProfile!;
  const authorTwoProfile = authorTwo.authorProfile!;

  await prisma.interviewType.createMany({
    data: [
      {
        authorId: authorOneProfile.id,
        name: "Zoom video call",
        durationOptionsMin: [30, 60, 90],
        bufferBeforeMin: 10,
        bufferAfterMin: 10,
        minNoticeHours: 24,
        cancellationPolicyHours: 24,
        locationRequired: false
      },
      {
        authorId: authorOneProfile.id,
        name: "Phone call",
        durationOptionsMin: [30, 45],
        bufferBeforeMin: 5,
        bufferAfterMin: 5,
        minNoticeHours: 12,
        cancellationPolicyHours: 12,
        locationRequired: false
      },
      {
        authorId: authorTwoProfile.id,
        name: "In-person",
        durationOptionsMin: [60, 90],
        bufferBeforeMin: 15,
        bufferAfterMin: 15,
        minNoticeHours: 48,
        cancellationPolicyHours: 48,
        locationRequired: true
      }
    ]
  });

  await prisma.availabilityRule.createMany({
    data: [
      {
        authorId: authorOneProfile.id,
        dayOfWeek: 1,
        startTimeLocal: "09:00",
        endTimeLocal: "12:00",
        active: true
      },
      {
        authorId: authorOneProfile.id,
        dayOfWeek: 3,
        startTimeLocal: "13:00",
        endTimeLocal: "17:00",
        active: true
      },
      {
        authorId: authorTwoProfile.id,
        dayOfWeek: 2,
        startTimeLocal: "10:00",
        endTimeLocal: "16:00",
        active: true
      },
      {
        authorId: authorTwoProfile.id,
        dayOfWeek: 4,
        startTimeLocal: "09:00",
        endTimeLocal: "12:00",
        active: true
      }
    ]
  });

  const nextWeek = DateTime.now().plus({ days: 7 }).toISODate()!;
  await prisma.availabilityOverride.createMany({
    data: [
      {
        authorId: authorOneProfile.id,
        dateLocal: nextWeek,
        type: OverrideType.ADD,
        startTimeLocal: "18:00",
        endTimeLocal: "20:00",
        note: "Extra evening slots"
      },
      {
        authorId: authorTwoProfile.id,
        dateLocal: nextWeek,
        type: OverrideType.REMOVE,
        note: "Travel day"
      }
    ]
  });

  const appointment = await prisma.appointment.create({
    data: {
      authorId: authorOneProfile.id,
      customerId: (await prisma.user.findFirst({ where: { email: "chloe@storykeeper.test" } }))!.id,
      interviewTypeId: (await prisma.interviewType.findFirst({ where: { authorId: authorOneProfile.id } }))!.id,
      startAtUtc: DateTime.now().plus({ days: 3 }).toUTC().toJSDate(),
      endAtUtc: DateTime.now().plus({ days: 3, hours: 1 }).toUTC().toJSDate(),
      status: AppointmentStatus.CONFIRMED,
      customerTimezone: "America/New_York",
      authorTimezone: "America/Los_Angeles",
      meetingLink: "https://zoom.us/j/123456789"
    }
  });

  await prisma.appointmentAudit.create({
    data: {
      appointmentId: appointment.id,
      actorUserId: admin.id,
      action: AuditAction.CONFIRMED,
      afterJson: appointment
    }
  });

  console.log("Seed data created", customers);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
