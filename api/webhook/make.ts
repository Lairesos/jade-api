import type { VercelRequest, VercelResponse } from "@vercel/node";
import { automationService } from "../../src/services/automation.service.js";
import { authenticateWebhook } from "../../src/middleware/auth.js";
import { applyCors } from "../../src/middleware/cors.js";
import { generateRequestId, logger } from "../../src/utils/logger.js";
import { sendSuccess, sendError } from "../../src/utils/response.js";
import { parseJsonBody, validate, makeWebhookSchema } from "../../src/utils/validation.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const requestId = generateRequestId();

  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    authenticateWebhook(req);

    const body = parseJsonBody(req.body);
    validate(makeWebhookSchema, body, "Make webhook payload");

    logger.info("Make webhook incoming", { requestId });

    const { response, event } = await automationService.handleIncomingWebhook(body);
    sendSuccess(res, { ...response, event }, requestId, 202);
  } catch (error) {
    sendError(res, error, requestId);
  }
}
