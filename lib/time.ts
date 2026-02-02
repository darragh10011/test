import { DateTime } from "luxon";

export function formatInZone(isoUtc: string, timezone: string) {
  return DateTime.fromISO(isoUtc, { zone: "utc" })
    .setZone(timezone)
    .toFormat("ccc, LLL d 'at' h:mm a ZZZZ");
}
