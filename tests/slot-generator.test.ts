import { describe, expect, it } from "vitest";
import { generateSlots } from "@/lib/scheduling/slot-generator";

const baseInput = {
  authorTimezone: "America/Los_Angeles",
  customerTimezone: "America/New_York",
  fromDate: "2030-05-01",
  toDate: "2030-05-01",
  durationMin: 60,
  granularityMin: 30,
  bufferBeforeMin: 10,
  bufferAfterMin: 10,
  minNoticeHours: 0,
  maxBookingsPerDay: null,
  availabilityRules: [
    {
      dayOfWeek: 3,
      startTimeLocal: "09:00",
      endTimeLocal: "12:00",
      active: true
    }
  ],
  overrides: [],
  existingAppointments: []
};

describe("generateSlots", () => {
  it("returns slots within availability windows", () => {
    const slots = generateSlots(baseInput);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].startAtUtc).toContain("2030");
  });

  it("respects remove overrides", () => {
    const slots = generateSlots({
      ...baseInput,
      overrides: [
        {
          dateLocal: "2030-05-01",
          type: "REMOVE"
        }
      ]
    });
    expect(slots.length).toBe(0);
  });
});
