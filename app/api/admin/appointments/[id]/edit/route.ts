import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { interviewTypeId, startAtUtc, endAtUtc, status, actorUserId } = body;

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id }
  });

  if (!appointment) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      interviewTypeId: interviewTypeId ?? appointment.interviewTypeId,
      startAtUtc: startAtUtc ? new Date(startAtUtc) : appointment.startAtUtc,
      endAtUtc: endAtUtc ? new Date(endAtUtc) : appointment.endAtUtc,
      status: status ?? appointment.status
    }
  });

  await prisma.appointmentAudit.create({
    data: {
      appointmentId: appointment.id,
      actorUserId: actorUserId ?? appointment.customerId,
      action: AuditAction.ADMIN_EDITED,
      beforeJson: appointment,
      afterJson: updated
    }
  });

  return Response.json({ appointment: updated });
}
