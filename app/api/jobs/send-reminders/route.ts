import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildIcs } from "@/lib/ics";

export async function POST(request: Request) {
  const secret = request.headers.get("x-job-secret");
  if (process.env.JOBS_SECRET && secret !== process.env.JOBS_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = DateTime.utc();
  const window24Start = now.plus({ hours: 23, minutes: 45 });
  const window24End = now.plus({ hours: 24, minutes: 15 });
  const window1Start = now.plus({ minutes: 45 });
  const window1End = now.plus({ minutes: 75 });

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      OR: [
        {
          startAtUtc: {
            gte: window24Start.toJSDate(),
            lte: window24End.toJSDate()
          }
        },
        {
          startAtUtc: {
            gte: window1Start.toJSDate(),
            lte: window1End.toJSDate()
          }
        }
      ]
    },
    include: {
      author: { include: { user: true } },
      customer: true,
      interviewType: true
    }
  });

  await Promise.all(
    appointments.map(async (appointment) => {
      const ics = await buildIcs({
        title: `${appointment.interviewType.name} with ${appointment.author.user.name}`,
        description: "StoryKeeper interview reminder",
        startUtc: appointment.startAtUtc.toISOString(),
        endUtc: appointment.endAtUtc.toISOString(),
        location: appointment.locationText ?? undefined,
        organizerName: appointment.author.user.name ?? "StoryKeeper",
        organizerEmail: appointment.author.user.email ?? undefined
      });

      const html = `<p>Reminder: your interview starts at ${appointment.startAtUtc.toISOString()}.</p>`;

      await Promise.all([
        appointment.customer.email
          ? sendEmail({
              to: appointment.customer.email,
              subject: "Interview reminder",
              html,
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
              subject: "Interview reminder",
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
    })
  );

  return Response.json({ count: appointments.length });
}
