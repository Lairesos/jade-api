import { sendToMake, parseMakeWebhook, buildWebhookResponse } from "../integrations/make/webhook.js";
import { triggerOperationExecuted, triggerAlertRaised } from "../integrations/make/triggers.js";
import { logger, generateRequestId } from "../utils/logger.js";
import type {
  MakeIncomingEvent,
  MakeScenarioResult,
  MakeTriggerPayload,
  MakeWebhookPayload,
  MakeWebhookResponse,
} from "../types/make.types.js";

export class AutomationService {
  async trigger(payload: MakeTriggerPayload): Promise<MakeScenarioResult> {
    logger.info("Triggering automation", {
      service: "automation",
      eventType: payload.eventType,
    });

    return sendToMake(payload);
  }

  async handleIncomingWebhook(body: unknown): Promise<{
    response: MakeWebhookResponse;
    event: MakeIncomingEvent | null;
  }> {
    const payload = parseMakeWebhook(body);
    const eventId = generateRequestId();

    logger.info("Make webhook received", {
      service: "automation",
      event: payload.event,
      eventId,
    });

    const event = this.parseIncomingEvent(payload);

    if (event) {
      await this.processIncomingEvent(event);
    }

    return {
      response: buildWebhookResponse(eventId),
      event,
    };
  }

  private parseIncomingEvent(payload: MakeWebhookPayload): MakeIncomingEvent | null {
    const { event, data } = payload;

    if (event.startsWith("task.")) {
      return {
        type: event as "task.created" | "task.updated" | "task.completed",
        taskId: String(data["taskId"] ?? ""),
        title: String(data["title"] ?? ""),
        status: data["status"] ? String(data["status"]) : undefined,
        assignee: data["assignee"] ? String(data["assignee"]) : undefined,
      };
    }

    if (event.startsWith("meeting.")) {
      return {
        type: event as "meeting.scheduled" | "meeting.cancelled" | "meeting.updated",
        eventId: String(data["eventId"] ?? ""),
        title: String(data["title"] ?? ""),
        start: String(data["start"] ?? ""),
        end: String(data["end"] ?? ""),
        attendees: data["attendees"] as string[] | undefined,
      };
    }

    if (event.startsWith("alert.")) {
      return {
        type: event as "alert.raised" | "alert.resolved",
        alertId: String(data["alertId"] ?? generateRequestId()),
        severity: (data["severity"] as "info" | "warning" | "critical") ?? "info",
        message: String(data["message"] ?? ""),
      };
    }

    if (event.startsWith("operation.")) {
      return {
        type: event as "operation.executed" | "operation.failed",
        operationId: String(data["operationId"] ?? ""),
        name: String(data["name"] ?? ""),
        result: data["result"],
        error: data["error"] ? String(data["error"]) : undefined,
      };
    }

    logger.warn("Unknown Make event type", { service: "automation", event });
    return null;
  }

  private async processIncomingEvent(event: MakeIncomingEvent): Promise<void> {
    switch (event.type) {
      case "alert.raised":
        logger.warn("Alert received from Make", {
          service: "automation",
          alertId: event.alertId,
          severity: event.severity,
          message: event.message,
        });
        break;

      case "operation.executed":
        await triggerOperationExecuted({
          operationId: event.operationId,
          name: event.name,
          status: "completed",
          result: event.result,
        }).catch(() => {});
        break;

      case "operation.failed":
        await triggerAlertRaised({
          alertId: generateRequestId(),
          severity: "critical",
          message: `Operation failed: ${event.name} — ${event.error ?? "unknown error"}`,
        }).catch(() => {});
        break;

      default:
        logger.info("Make event processed", {
          service: "automation",
          type: event.type,
        });
    }
  }
}

export const automationService = new AutomationService();
