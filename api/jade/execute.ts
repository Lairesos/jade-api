import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jadeAgent } from "../../src/core/jade/agent.js";
import { authenticateRequest, extractUserId } from "../../src/middleware/auth.js";
import { applyCors } from "../../src/middleware/cors.js";
import { checkRateLimit, getRateLimitIdentifier } from "../../src/middleware/rateLimit.js";
import { generateRequestId, logger } from "../../src/utils/logger.js";
import { sendSuccess, sendError } from "../../src/utils/response.js";
import { parseJsonBody, validate, jadeRequestSchema } from "../../src/utils/validation.js";
import { z } from "zod";

const executeSchema = jadeRequestSchema.extend({
  intent: z.enum([
    "schedule_meeting",
    "create_task",
    "update_task",
    "query_knowledge",
    "execute_operation",
    "generate_report",
  ]),
});

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
    authenticateRequest(req);

    const userId = extractUserId(req);
    const ip = req.headers["x-forwarded-for"] as string | undefined;
    checkRateLimit(getRateLimitIdentifier(ip, userId));

    const body = parseJsonBody(req.body);
    const request = validate(executeSchema, body, "Execute request");

    if (userId && request.context) {
      request.context.userId = userId;
    }

    logger.info("Jade execute request", {
      requestId,
      userId,
      intent: request.intent,
    });

    const response = await jadeAgent.process(request);
    sendSuccess(res, response, requestId);
  } catch (error) {
    sendError(res, error, requestId);
  }
}
