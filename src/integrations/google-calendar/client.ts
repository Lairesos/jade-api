import { google } from "googleapis";
import { getEnv } from "../../config/env.js";

let calendarClient: ReturnType<typeof google.calendar> | null = null;

export function getCalendarClient(): ReturnType<typeof google.calendar> {
  if (!calendarClient) {
    const env = getEnv();

    const auth = new google.auth.JWT({
      email: env.GOOGLE_CLIENT_EMAIL,
      key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    calendarClient = google.calendar({ version: "v3", auth });
  }

  return calendarClient;
}

export function getCalendarId(): string {
  return getEnv().GOOGLE_CALENDAR_ID;
}

export function resetCalendarClient(): void {
  calendarClient = null;
}
