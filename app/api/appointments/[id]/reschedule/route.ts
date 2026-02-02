import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { buildIcs } from "@/lib/ics";
import { sendEmail } from "@/lib/email";
import { AuditAction } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const { startAtUtc, endAtUtc } = body;

  if (!startAtUtc || !endAtUtc) {
    return Response.json({ error: "Missing new time" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      author: { include: { user: true } },
      customer: true,
      interviewType: true
    }
  });

  if (!appointment) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  const policyHours = appointment.interviewType.cancellationPolicyHours;
  const hoursUntil = DateTime.fromJSDate(appointment.startAtUtc).diffNow("hours").hours;
  if (hoursUntil < policyHours) {
    return Response.json({ error: "Reschedule window closed" }, { status: 403 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const overlap = await tx.appointment.findFirst({
        where: {
          authorId: appointment.authorId,
          id: { not: appointment.id },
          status: { in: ["PENDING", "CONFIRMED"] },
          startAtUtc: { lt: new Date(endAtUtc) },
          endAtUtc: { gt: new Date(startAtUtc) }
        }
      });

      if (overlap) {
        throw new Error("Slot no longer available");
      }

      const before = appointment;
      const next = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          startAtUtc: new Date(startAtUtc),
          endAtUtc: new Date(endAtUtc)
        }
      });

      await tx.appointmentAudit.create({
        data: {
          appointmentId: appointment.id,
          actorUserId: appointment.customerId,
          action: AuditAction.RESCHEDULED,
          beforeJson: before,
          afterJson: next
        }
      });

      return next;
    });

    const ics = await buildIcs({
      title: `${appointment.interviewType.name} with ${appointment.author.user.name}`,
      description: "StoryKeeper interview session (rescheduled)",
      startUtc: updated.startAtUtc.toISOString(),
      endUtc: updated.endAtUtc.toISOString(),
      location: appointment.locationText ?? undefined,
      organizerName: appointment.author.user.name ?? "StoryKeeper",
      organizerEmail: appointment.author.user.email ?? undefined
    });

    await Promise.all([
      appointment.customer.email
        ? sendEmail({
            to: appointment.customer.email,
            subject: "Interview rescheduled",
            html: "<p>Your interview has been rescheduled.</p>",
            attachments: [
              {
                filename: "interview.ics",
                content: ics,
                contentType: "text/calendar"
              }
            ]
          })
        : Promise.resolve(),
      appointment.author.user.email
        ? sendEmail({
            to: appointment.author.user.email,
            subject: "Interview rescheduled",
            html: "<p>Your interview has been rescheduled.</p>",
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

    return Response.json({ appointment: updated });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reschedule failed" },
      { status: 409 }
    );
  }
}
