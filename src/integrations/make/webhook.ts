import { getEnv } from "../../config/env.js";
import { IntegrationError } from "../../core/errors/AppError.js";
import { logger } from "../../utils/logger.js";
import type {
  MakeScenarioResult,
  MakeTriggerPayload,
  MakeWebhookPayload,
  MakeWebhookResponse,
} from "../../types/make.types.js";
import { generateRequestId } from "../../utils/logger.js";

export async function sendToMake(
  payload: MakeTriggerPayload,
): Promise<MakeScenarioResult> {
  const env = getEnv();

  if (!env.MAKE_WEBHOOK_URL) {
    logger.warn("Make webhook URL not configured, skipping trigger", {
      service: "make",
      eventType: payload.eventType,
    });
    return { success: false, error: "MAKE_WEBHOOK_URL not configured" };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (env.MAKE_API_KEY) {
      headers["Authorization"] = `Bearer ${env.MAKE_API_KEY}`;
    }

    const response = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType: payload.eventType,
        payload: payload.payload,
        metadata: {
          ...payload.metadata,
          source: "jade-core",
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Make webhook returned ${response.status}: ${response.statusText}`);
    }

    logger.info("Make scenario triggered", {
      service: "make",
      eventType: payload.eventType,
      status: response.status,
    });

    return { success: true, executionId: generateRequestId() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Make error";
    logger.error("Make trigger failed", { service: "make", message });
    throw new IntegrationError("make", `Trigger failed: ${message}`);
  }
}

export function parseMakeWebhook(body: unknown): MakeWebhookPayload {
  if (!body || typeof body !== "object") {
    throw new IntegrationError("make", "Invalid webhook payload");
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload["event"] !== "string") {
    throw new IntegrationError("make", "Missing event field in webhook payload");
  }

  return {
    event: payload["event"],
    timestamp: typeof payload["timestamp"] === "string"
      ? payload["timestamp"]
      : new Date().toISOString(),
    data: (payload["data"] as Record<string, unknown>) ?? {},
    source: typeof payload["source"] === "string" ? payload["source"] : undefined,
  };
}

export function buildWebhookResponse(
  eventId: string,
): MakeWebhookResponse {
  return {
    received: true,
    eventId,
    processedAt: new Date().toISOString(),
  };
}
