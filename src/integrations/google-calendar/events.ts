import { getCalendarClient, getCalendarId } from "./client.js";
import { CALENDAR_DEFAULTS } from "../../config/constants.js";
import { IntegrationError } from "../../core/errors/AppError.js";
import { logger } from "../../utils/logger.js";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  ListCalendarEventsInput,
  UpdateCalendarEventInput,
} from "../../types/calendar.types.js";
import type { calendar_v3 } from "googleapis";

export async function listEvents(
  input: ListCalendarEventsInput = {},
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: input.timeMin ?? new Date().toISOString(),
      timeMax: input.timeMax,
      maxResults: input.maxResults ?? CALENDAR_DEFAULTS.MAX_EVENTS_PER_QUERY,
      singleEvents: input.singleEvents ?? true,
      orderBy: input.orderBy ?? "startTime",
      q: input.query,
      timeZone: CALENDAR_DEFAULTS.TIMEZONE,
    });

    const events = (response.data.items ?? []).map(mapGoogleEvent);

    logger.debug("Calendar events listed", {
      service: "google-calendar",
      count: events.length,
    });

    return events;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Calendar error";
    logger.error("Calendar list failed", { service: "google-calendar", message });
    throw new IntegrationError("google-calendar", `List events failed: ${message}`);
  }
}

export async function createEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  try {
    const eventBody: calendar_v3.Schema$Event = {
      summary: input.title,
      description: input.description,
      start: input.start,
      end: input.end,
      location: input.location,
      attendees: input.attendees?.map((a) => ({
        email: a.email,
        displayName: a.displayName,
        optional: a.optional,
      })),
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventBody,
      sendNotifications: input.sendNotifications ?? true,
    });

    logger.info("Calendar event created", {
      service: "google-calendar",
      eventId: response.data.id,
      title: input.title,
    });

    return mapGoogleEvent(response.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Calendar error";
    logger.error("Calendar create failed", { service: "google-calendar", message });
    throw new IntegrationError("google-calendar", `Create event failed: ${message}`);
  }
}

export async function updateEvent(
  input: UpdateCalendarEventInput,
): Promise<CalendarEvent> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  try {
    const eventBody: calendar_v3.Schema$Event = {};

    if (input.title) eventBody.summary = input.title;
    if (input.description) eventBody.description = input.description;
    if (input.start) eventBody.start = input.start;
    if (input.end) eventBody.end = input.end;
    if (input.location) eventBody.location = input.location;
    if (input.attendees) {
      eventBody.attendees = input.attendees.map((a) => ({
        email: a.email,
        displayName: a.displayName,
      }));
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId: input.eventId,
      requestBody: eventBody,
    });

    logger.info("Calendar event updated", {
      service: "google-calendar",
      eventId: input.eventId,
    });

    return mapGoogleEvent(response.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Calendar error";
    throw new IntegrationError("google-calendar", `Update event failed: ${message}`);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  try {
    await calendar.events.delete({ calendarId, eventId });
    logger.info("Calendar event deleted", {
      service: "google-calendar",
      eventId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Calendar error";
    throw new IntegrationError("google-calendar", `Delete event failed: ${message}`);
  }
}

export async function getEvent(eventId: string): Promise<CalendarEvent> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  try {
    const response = await calendar.events.get({ calendarId, eventId });
    return mapGoogleEvent(response.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Calendar error";
    throw new IntegrationError("google-calendar", `Get event failed: ${message}`);
  }
}

function mapGoogleEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  return {
    id: event.id ?? "",
    title: event.summary ?? "Untitled",
    description: event.description ?? undefined,
    start: {
      dateTime: event.start?.dateTime ?? undefined,
      date: event.start?.date ?? undefined,
      timeZone: event.start?.timeZone ?? undefined,
    },
    end: {
      dateTime: event.end?.dateTime ?? undefined,
      date: event.end?.date ?? undefined,
      timeZone: event.end?.timeZone ?? undefined,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email ?? "",
      displayName: a.displayName ?? undefined,
      responseStatus: (a.responseStatus ?? undefined) as
        | "needsAction"
        | "declined"
        | "tentative"
        | "accepted"
        | undefined,
      optional: a.optional ?? undefined,
    })),
    location: event.location ?? undefined,
    status: (event.status as CalendarEvent["status"]) ?? "confirmed",
    htmlLink: event.htmlLink ?? undefined,
    created: event.created ?? undefined,
    updated: event.updated ?? undefined,
  };
}
