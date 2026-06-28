export const JADE_IDENTITY = {
  name: "Jade",
  role: "Diretora de Operações IA",
  version: "1.0.0",
} as const;

export const API_VERSION = "v1";

export const RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 100,
} as const;

export const OPENAI_DEFAULTS = {
  TEMPERATURE: 0.7,
  TOP_P: 1,
  FREQUENCY_PENALTY: 0,
  PRESENCE_PENALTY: 0,
} as const;

export const NOTION_PAGE_SIZE = 100;

export const CALENDAR_DEFAULTS = {
  TIMEZONE: "America/Sao_Paulo",
  DEFAULT_DURATION_MINUTES: 60,
  MAX_EVENTS_PER_QUERY: 50,
} as const;

export const MAKE_EVENT_TYPES = {
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_COMPLETED: "task.completed",
  MEETING_SCHEDULED: "meeting.scheduled",
  OPERATION_EXECUTED: "operation.executed",
  ALERT_RAISED: "alert.raised",
} as const;

export type MakeEventType =
  (typeof MAKE_EVENT_TYPES)[keyof typeof MAKE_EVENT_TYPES];
