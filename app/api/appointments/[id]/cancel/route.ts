import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { AppointmentStatus, AuditAction } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const { reason } = body;

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
    return Response.json({ error: "Cancellation window closed" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED }
    });

    await tx.appointmentAudit.create({
      data: {
        appointmentId: appointment.id,
        actorUserId: appointment.customerId,
        action: AuditAction.CANCELLED,
        beforeJson: appointment,
        afterJson: { ...next, reason }
      }
    });

    return next;
  });

  await Promise.all([
    appointment.customer.email
      ? sendEmail({
          to: appointment.customer.email,
          subject: "Interview cancelled",
          html: `<p>Your interview was cancelled. Reason: ${reason ?? "n/a"}</p>`
        })
      : Promise.resolve(),
    appointment.author.user.email
      ? sendEmail({
          to: appointment.author.user.email,
          subject: "Interview cancelled",
          html: `<p>The interview was cancelled. Reason: ${reason ?? "n/a"}</p>`
        })
      : Promise.resolve()
  ]);

  return Response.json({ appointment: updated });
}
