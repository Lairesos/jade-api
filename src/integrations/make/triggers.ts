import { sendToMake } from "./webhook.js";
import { MAKE_EVENT_TYPES } from "../../config/constants.js";
import { logger } from "../../utils/logger.js";
import type { MakeScenarioResult } from "../../types/make.types.js";

export async function triggerTaskCreated(task: {
  id: string;
  title: string;
  priority: string;
  assignee?: string;
}): Promise<MakeScenarioResult> {
  return sendToMake({
    eventType: MAKE_EVENT_TYPES.TASK_CREATED,
    payload: {
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      assignee: task.assignee,
    },
  });
}

export async function triggerTaskCompleted(task: {
  id: string;
  title: string;
  completedAt: string;
}): Promise<MakeScenarioResult> {
  return sendToMake({
    eventType: MAKE_EVENT_TYPES.TASK_COMPLETED,
    payload: {
      taskId: task.id,
      title: task.title,
      completedAt: task.completedAt,
    },
  });
}

export async function triggerMeetingScheduled(meeting: {
  eventId: string;
  title: string;
  start: string;
  end: string;
  attendees?: string[];
}): Promise<MakeScenarioResult> {
  return sendToMake({
    eventType: MAKE_EVENT_TYPES.MEETING_SCHEDULED,
    payload: meeting,
  });
}

export async function triggerOperationExecuted(operation: {
  operationId: string;
  name: string;
  status: string;
  result?: unknown;
}): Promise<MakeScenarioResult> {
  return sendToMake({
    eventType: MAKE_EVENT_TYPES.OPERATION_EXECUTED,
    payload: operation,
  });
}

export async function triggerAlertRaised(alert: {
  alertId: string;
  severity: string;
  message: string;
}): Promise<MakeScenarioResult> {
  logger.warn("Alert raised via Make", {
    service: "make",
    alertId: alert.alertId,
    severity: alert.severity,
  });

  return sendToMake({
    eventType: MAKE_EVENT_TYPES.ALERT_RAISED,
    payload: alert,
    metadata: { priority: alert.severity === "critical" ? "high" : "normal" },
  });
}
