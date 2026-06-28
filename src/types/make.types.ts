export interface MakeWebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  source?: string;
}

export interface MakeTriggerPayload {
  eventType: string;
  payload: Record<string, unknown>;
  metadata?: MakeTriggerMetadata;
}

export interface MakeTriggerMetadata {
  correlationId?: string;
  source?: string;
  priority?: "low" | "normal" | "high";
}

export interface MakeWebhookResponse {
  received: boolean;
  eventId: string;
  processedAt: string;
}

export interface MakeScenarioResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

export type MakeIncomingEvent =
  | MakeTaskEvent
  | MakeMeetingEvent
  | MakeAlertEvent
  | MakeOperationEvent;

export interface MakeTaskEvent {
  type: "task.created" | "task.updated" | "task.completed";
  taskId: string;
  title: string;
  status?: string;
  assignee?: string;
}

export interface MakeMeetingEvent {
  type: "meeting.scheduled" | "meeting.cancelled" | "meeting.updated";
  eventId: string;
  title: string;
  start: string;
  end: string;
  attendees?: string[];
}

export interface MakeAlertEvent {
  type: "alert.raised" | "alert.resolved";
  alertId: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface MakeOperationEvent {
  type: "operation.executed" | "operation.failed";
  operationId: string;
  name: string;
  result?: unknown;
  error?: string;
}
