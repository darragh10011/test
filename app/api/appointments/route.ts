import { prisma } from "@/lib/db";
import { buildIcs } from "@/lib/ics";
import { sendEmail } from "@/lib/email";
import { AppointmentStatus, AuditAction, Role } from "@prisma/client";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    authorId,
    interviewTypeId,
    startAtUtc,
    endAtUtc,
    customerTimezone,
    customerEmail,
    locationText
  } = body;

  if (!authorId || !interviewTypeId || !startAtUtc || !endAtUtc || !customerEmail) {
    return Response.json({ error: "Missing booking details" }, { status: 400 });
  }

  const author = await prisma.authorProfile.findUnique({
    where: { id: authorId },
    include: { user: true }
  });

  if (!author) {
    return Response.json({ error: "Author not found" }, { status: 404 });
  }

  const interviewType = await prisma.interviewType.findUnique({
    where: { id: interviewTypeId }
  });

  if (!interviewType || interviewType.authorId !== author.id) {
    return Response.json({ error: "Interview type not found" }, { status: 404 });
  }

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      name: customerEmail.split("@")[0],
      role: Role.CUSTOMER,
      timezone: customerTimezone ?? "UTC"
    }
  });

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const overlap = await tx.appointment.findFirst({
        where: {
          authorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startAtUtc: { lt: new Date(endAtUtc) },
          endAtUtc: { gt: new Date(startAtUtc) }
        }
      });

      if (overlap) {
        throw new Error("Slot no longer available");
      }

      const created = await tx.appointment.create({
        data: {
          authorId,
          customerId: customer.id,
          interviewTypeId,
          startAtUtc: new Date(startAtUtc),
          endAtUtc: new Date(endAtUtc),
          status: AppointmentStatus.CONFIRMED,
          customerTimezone: customerTimezone ?? "UTC",
          authorTimezone: author.user.timezone,
          locationText: locationText ?? null
        }
      });

      await tx.appointmentAudit.create({
        data: {
          appointmentId: created.id,
          actorUserId: customer.id,
          action: AuditAction.CREATED,
          afterJson: created
        }
      });

      return created;
    });

    const ics = await buildIcs({
      title: `${interviewType.name} with ${author.user.name}`,
      description: "StoryKeeper interview session",
      startUtc: appointment.startAtUtc.toISOString(),
      endUtc: appointment.endAtUtc.toISOString(),
      location: locationText ?? undefined,
      organizerName: author.user.name ?? "StoryKeeper",
      organizerEmail: author.user.email ?? undefined
    });

    const html = `<p>Your interview is confirmed.</p>`;

    await Promise.all([
      sendEmail({
        to: customer.email ?? customerEmail,
        subject: "Interview confirmed",
        html,
        attachments: [
          {
            filename: "interview.ics",
            content: ics,
            contentType: "text/calendar"
          }
        ]
      }),
      author.user.email
        ? sendEmail({
            to: author.user.email,
            subject: "New interview booked",
            html,
            attachments: [
              {
                filename: "interview.ics",
                content: ics,
                contentType: "text/calendar"
              }
            ]
          })
        : Promise.resolve()
    ]);

    return Response.json({ appointment });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 409 }
    );
  }
}
