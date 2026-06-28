export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: CalendarDateTime;
  end: CalendarDateTime;
  attendees?: CalendarAttendee[];
  location?: string;
  status: "confirmed" | "tentative" | "cancelled";
  htmlLink?: string;
  created?: string;
  updated?: string;
}

export interface CalendarDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  optional?: boolean;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  start: CalendarDateTime;
  end: CalendarDateTime;
  attendees?: CalendarAttendee[];
  location?: string;
  sendNotifications?: boolean;
}

export interface UpdateCalendarEventInput {
  eventId: string;
  title?: string;
  description?: string;
  start?: CalendarDateTime;
  end?: CalendarDateTime;
  attendees?: CalendarAttendee[];
  location?: string;
}

export interface ListCalendarEventsInput {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  query?: string;
  singleEvents?: boolean;
  orderBy?: "startTime" | "updated";
}

export interface CalendarAvailability {
  start: string;
  end: string;
  available: boolean;
}

export interface FindAvailabilityInput {
  timeMin: string;
  timeMax: string;
  durationMinutes: number;
  attendees?: string[];
}
