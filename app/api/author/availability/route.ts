import { prisma } from "@/lib/db";
import { OverrideType } from "@prisma/client";

export async function POST(request: Request) {
  const { authorId, rule } = await request.json();
  if (!authorId || !rule) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  const created = await prisma.availabilityRule.create({
    data: {
      authorId,
      dayOfWeek: rule.dayOfWeek,
      startTimeLocal: rule.startTimeLocal,
      endTimeLocal: rule.endTimeLocal,
      active: true
    }
  });

  return Response.json({ rule: created });
}

export async function PUT(request: Request) {
  const { authorId, override } = await request.json();
  if (!authorId || !override) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  const created = await prisma.availabilityOverride.create({
    data: {
      authorId,
      dateLocal: override.dateLocal,
      type: override.type as OverrideType,
      startTimeLocal: override.startTimeLocal || null,
      endTimeLocal: override.endTimeLocal || null,
      note: override.note || null
    }
  });

  return Response.json({ override: created });
}
