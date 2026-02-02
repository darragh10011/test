import { describe, expect, it } from "vitest";
import { generateSlots } from "@/lib/scheduling/slot-generator";

const input = {
  authorTimezone: "UTC",
  customerTimezone: "UTC",
  fromDate: "2031-06-10",
  toDate: "2031-06-10",
  durationMin: 60,
  granularityMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  minNoticeHours: 0,
  maxBookingsPerDay: null,
  availabilityRules: [
    {
      dayOfWeek: 2,
      startTimeLocal: "09:00",
      endTimeLocal: "12:00",
      active: true
    }
  ],
  overrides: [],
  existingAppointments: [
    {
      startAtUtc: "2031-06-10T10:00:00.000Z",
      endAtUtc: "2031-06-10T11:00:00.000Z",
      status: "CONFIRMED"
    }
  ]
};

describe("booking conflict logic", () => {
  it("removes overlapping slots", () => {
    const slots = generateSlots(input);
    const conflict = slots.find((slot) => slot.startAtUtc.includes("10:00"));
    expect(conflict).toBeUndefined();
  });
});
