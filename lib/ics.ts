import { createEvent } from "ics";
import { DateTime } from "luxon";

export type IcsInput = {
  title: string;
  description?: string;
  startUtc: string;
  endUtc: string;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
};

export function buildIcs(input: IcsInput): Promise<string> {
  const start = DateTime.fromISO(input.startUtc, { zone: "utc" });
  const end = DateTime.fromISO(input.endUtc, { zone: "utc" });

  return new Promise((resolve, reject) => {
    createEvent(
      {
        title: input.title,
        description: input.description,
        start: [
          start.year,
          start.month,
          start.day,
          start.hour,
          start.minute
        ],
        end: [end.year, end.month, end.day, end.hour, end.minute],
        location: input.location,
        organizer: input.organizerEmail
          ? {
              name: input.organizerName || input.organizerEmail,
              email: input.organizerEmail
            }
          : undefined
      },
      (error, value) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(value);
      }
    );
  });
}
