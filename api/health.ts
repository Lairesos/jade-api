import type { VercelRequest, VercelResponse } from "@vercel/node";
import { healthService } from "../src/services/health.service.js";
import { generateRequestId, logger } from "../src/utils/logger.js";
import { sendSuccess, sendError } from "../src/utils/response.js";
import { applyCors } from "../src/middleware/cors.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const requestId = generateRequestId();

  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    logger.info("Health check", { requestId });
    const status = await healthService.getStatus();
    sendSuccess(res, status, requestId);
  } catch (error) {
    sendError(res, error, requestId);
  }
}
