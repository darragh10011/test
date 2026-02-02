import { prisma } from "@/lib/db";
import { formatInZone } from "@/lib/time";
import { AppointmentActions } from "./AppointmentActions";

export default async function AppointmentDetailPage({
  params
}: {
  params: { id: string };
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { author: { include: { user: true } }, customer: true, interviewType: true }
  });

  if (!appointment) {
    return <p>Appointment not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Appointment details</h1>
        <p className="text-muted-foreground">Status: {appointment.status}</p>
      </div>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm">
          <div>
            <dt className="font-medium">Author</dt>
            <dd>{appointment.author.user.name}</dd>
          </div>
          <div>
            <dt className="font-medium">Customer</dt>
            <dd>{appointment.customer.name}</dd>
          </div>
          <div>
            <dt className="font-medium">Interview type</dt>
            <dd>{appointment.interviewType.name}</dd>
          </div>
          <div>
            <dt className="font-medium">Start time</dt>
            <dd>{formatInZone(appointment.startAtUtc.toISOString(), appointment.customerTimezone)}</dd>
          </div>
          <div>
            <dt className="font-medium">Location</dt>
            <dd>{appointment.locationText ?? appointment.meetingLink ?? "TBD"}</dd>
          </div>
        </dl>
      </div>
      <AppointmentActions appointmentId={appointment.id} />
    </div>
  );
}
