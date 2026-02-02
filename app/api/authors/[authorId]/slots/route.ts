import { prisma } from "@/lib/db";
import { generateSlots } from "@/lib/scheduling/slot-generator";

export async function GET(
  request: Request,
  { params }: { params: { authorId: string } }
) {
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get("typeId");
  const duration = Number(searchParams.get("duration"));
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const timezone = searchParams.get("tz") ?? "UTC";

  if (!typeId || !duration || !from || !to) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const author = await prisma.authorProfile.findUnique({
    where: { id: params.authorId },
    include: {
      user: true,
      availability: true,
      overrides: true
    }
  });

  if (!author) {
    return Response.json({ error: "Author not found" }, { status: 404 });
  }

  const interviewType = await prisma.interviewType.findUnique({
    where: { id: typeId }
  });

  if (!interviewType) {
    return Response.json({ error: "Interview type not found" }, { status: 404 });
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      authorId: author.id,
      status: { in: ["PENDING", "CONFIRMED"] }
    }
  });

  const slots = generateSlots({
    authorTimezone: author.user.timezone,
    customerTimezone: timezone,
    fromDate: from,
    toDate: to,
    durationMin: duration,
    granularityMin: author.slotGranularityMin,
    bufferBeforeMin: interviewType.bufferBeforeMin ?? author.defaultBufferBeforeMin,
    bufferAfterMin: interviewType.bufferAfterMin ?? author.defaultBufferAfterMin,
    minNoticeHours: interviewType.minNoticeHours,
    maxBookingsPerDay: author.maxBookingsPerDay,
    availabilityRules: author.availability,
    overrides: author.overrides,
    existingAppointments: existingAppointments.map((appt) => ({
      startAtUtc: appt.startAtUtc.toISOString(),
      endAtUtc: appt.endAtUtc.toISOString(),
      status: appt.status
    }))
  });

  return Response.json({ slots });
}
