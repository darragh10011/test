import { DateTime, Interval } from "luxon";

export type AvailabilityRule = {
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  active: boolean;
};

export type AvailabilityOverride = {
  dateLocal: string;
  type: "ADD" | "REMOVE";
  startTimeLocal?: string | null;
  endTimeLocal?: string | null;
};

export type ExistingAppointment = {
  startAtUtc: string;
  endAtUtc: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
};

export type Slot = {
  startAtUtc: string;
  endAtUtc: string;
  startAtLocal: string;
  endAtLocal: string;
};

export type SlotGenerationInput = {
  authorTimezone: string;
  customerTimezone: string;
  fromDate: string;
  toDate: string;
  durationMin: number;
  granularityMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  minNoticeHours?: number | null;
  maxBookingsPerDay?: number | null;
  availabilityRules: AvailabilityRule[];
  overrides: AvailabilityOverride[];
  existingAppointments: ExistingAppointment[];
};

const WEEKDAY_MAP: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6
};

function timeToDateTime(date: DateTime, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return date.set({ hour, minute, second: 0, millisecond: 0 });
}

function subtractWindow(
  windows: Interval[],
  removeStart: DateTime,
  removeEnd: DateTime
) {
  return windows.flatMap((window) => {
    const removal = Interval.fromDateTimes(removeStart, removeEnd);
    if (!window.overlaps(removal)) {
      return [window];
    }
    const parts: Interval[] = [];
    if (removeStart > window.start) {
      parts.push(Interval.fromDateTimes(window.start, removeStart));
    }
    if (removeEnd < window.end) {
      parts.push(Interval.fromDateTimes(removeEnd, window.end));
    }
    return parts;
  });
}

export function generateSlots(input: SlotGenerationInput): Slot[] {
  const {
    authorTimezone,
    customerTimezone,
    fromDate,
    toDate,
    durationMin,
    granularityMin,
    bufferBeforeMin,
    bufferAfterMin,
    minNoticeHours,
    maxBookingsPerDay,
    availabilityRules,
    overrides,
    existingAppointments
  } = input;

  const customerStart = DateTime.fromISO(fromDate, { zone: customerTimezone })
    .startOf("day");
  const customerEnd = DateTime.fromISO(toDate, { zone: customerTimezone })
    .endOf("day");
  const authorStart = customerStart.setZone(authorTimezone).startOf("day");
  const authorEnd = customerEnd.setZone(authorTimezone).endOf("day");
  const nowUtc = DateTime.utc();

  const appointments = existingAppointments.filter((appt) =>
    ["PENDING", "CONFIRMED"].includes(appt.status)
  );

  const slots: Slot[] = [];

  for (
    let cursor = authorStart;
    cursor <= authorEnd;
    cursor = cursor.plus({ days: 1 })
  ) {
    const dayOfWeek = WEEKDAY_MAP[cursor.weekday];
    const rules = availabilityRules.filter(
      (rule) => rule.active && rule.dayOfWeek === dayOfWeek
    );

    if (!rules.length) {
      continue;
    }

    const overridesForDate = overrides.filter(
      (override) => override.dateLocal === cursor.toISODate()
    );
    const hasFullRemove = overridesForDate.some(
      (override) => override.type === "REMOVE" && !override.startTimeLocal
    );

    if (hasFullRemove) {
      continue;
    }

    let windows = rules.map((rule) =>
      Interval.fromDateTimes(
        timeToDateTime(cursor, rule.startTimeLocal),
        timeToDateTime(cursor, rule.endTimeLocal)
      )
    );

    for (const override of overridesForDate) {
      if (override.type === "ADD" && override.startTimeLocal && override.endTimeLocal) {
        windows.push(
          Interval.fromDateTimes(
            timeToDateTime(cursor, override.startTimeLocal),
            timeToDateTime(cursor, override.endTimeLocal)
          )
        );
      }
      if (override.type === "REMOVE" && override.startTimeLocal && override.endTimeLocal) {
        windows = subtractWindow(
          windows,
          timeToDateTime(cursor, override.startTimeLocal),
          timeToDateTime(cursor, override.endTimeLocal)
        );
      }
    }

    const bookingCount = appointments.filter((appt) => {
      const start = DateTime.fromISO(appt.startAtUtc, { zone: "utc" }).setZone(
        authorTimezone
      );
      return start.hasSame(cursor, "day");
    }).length;

    if (maxBookingsPerDay && bookingCount >= maxBookingsPerDay) {
      continue;
    }

    for (const window of windows) {
      let slotStart = window.start;
      const slotEndLimit = window.end.minus({ minutes: durationMin });

      while (slotStart <= slotEndLimit) {
        const slotEnd = slotStart.plus({ minutes: durationMin });
        const bufferedStart = slotStart.minus({ minutes: bufferBeforeMin });
        const bufferedEnd = slotEnd.plus({ minutes: bufferAfterMin });

        if (bufferedStart < window.start || bufferedEnd > window.end) {
          slotStart = slotStart.plus({ minutes: granularityMin });
          continue;
        }

        const slotStartUtc = slotStart.toUTC();
        if (
          minNoticeHours &&
          slotStartUtc < nowUtc.plus({ hours: minNoticeHours })
        ) {
          slotStart = slotStart.plus({ minutes: granularityMin });
          continue;
        }

        const overlaps = appointments.some((appt) => {
          const apptStart = DateTime.fromISO(appt.startAtUtc, { zone: "utc" });
          const apptEnd = DateTime.fromISO(appt.endAtUtc, { zone: "utc" });
          return Interval.fromDateTimes(
            bufferedStart.toUTC(),
            bufferedEnd.toUTC()
          ).overlaps(Interval.fromDateTimes(apptStart, apptEnd));
        });

        if (!overlaps) {
          const customerStartLocal = slotStart.setZone(customerTimezone);
          const customerEndLocal = slotEnd.setZone(customerTimezone);
          slots.push({
            startAtUtc: slotStart.toUTC().toISO(),
            endAtUtc: slotEnd.toUTC().toISO(),
            startAtLocal: customerStartLocal.toISO(),
            endAtLocal: customerEndLocal.toISO()
          });
        }

        slotStart = slotStart.plus({ minutes: granularityMin });
      }
    }
  }

  return slots.filter((slot) => {
    const start = DateTime.fromISO(slot.startAtUtc, { zone: "utc" });
    return start >= customerStart.toUTC() && start <= customerEnd.toUTC();
  });
}
