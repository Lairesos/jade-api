import {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  getEvent,
} from "../integrations/google-calendar/events.js";
import { triggerMeetingScheduled } from "../integrations/make/triggers.js";
import { CALENDAR_DEFAULTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  ListCalendarEventsInput,
} from "../types/calendar.types.js";

export interface ScheduleMeetingInput {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  location?: string;
}

export class SchedulingService {
  async scheduleMeeting(input: ScheduleMeetingInput): Promise<CalendarEvent> {
    const eventInput: CreateCalendarEventInput = {
      title: input.title,
      description: input.description,
      start: {
        dateTime: input.startDateTime,
        timeZone: CALENDAR_DEFAULTS.TIMEZONE,
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: CALENDAR_DEFAULTS.TIMEZONE,
      },
      attendees: input.attendees?.map((email) => ({ email })),
      location: input.location,
      sendNotifications: true,
    };

    const event = await createEvent(eventInput);

    await triggerMeetingScheduled({
      eventId: event.id,
      title: event.title,
      start: input.startDateTime,
      end: input.endDateTime,
      attendees: input.attendees,
    }).catch((err) => {
      logger.warn("Failed to trigger Make on meeting scheduled", {
        service: "scheduling",
        error: err instanceof Error ? err.message : "unknown",
      });
    });

    return event;
  }

  async listEvents(input: ListCalendarEventsInput = {}): Promise<CalendarEvent[]> {
    return listEvents(input);
  }

  async getUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return listEvents({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      orderBy: "startTime",
      singleEvents: true,
    });
  }

  async updateMeeting(
    eventId: string,
    updates: Partial<ScheduleMeetingInput>,
  ): Promise<CalendarEvent> {
    return updateEvent({
      eventId,
      title: updates.title,
      description: updates.description,
      start: updates.startDateTime
        ? { dateTime: updates.startDateTime, timeZone: CALENDAR_DEFAULTS.TIMEZONE }
        : undefined,
      end: updates.endDateTime
        ? { dateTime: updates.endDateTime, timeZone: CALENDAR_DEFAULTS.TIMEZONE }
        : undefined,
      attendees: updates.attendees?.map((email) => ({ email })),
      location: updates.location,
    });
  }

  async cancelMeeting(eventId: string): Promise<void> {
    await deleteEvent(eventId);
    logger.info("Meeting cancelled", { service: "scheduling", eventId });
  }

  async getMeeting(eventId: string): Promise<CalendarEvent> {
    return getEvent(eventId);
  }
}

export const schedulingService = new SchedulingService();
