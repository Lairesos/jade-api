import type { VercelRequest, VercelResponse } from "@vercel/node";
import { knowledgeService } from "../../src/services/knowledge.service.js";
import { authenticateRequest } from "../../src/middleware/auth.js";
import { applyCors } from "../../src/middleware/cors.js";
import { checkRateLimit, getRateLimitIdentifier } from "../../src/middleware/rateLimit.js";
import { generateRequestId, logger } from "../../src/utils/logger.js";
import { sendSuccess, sendError } from "../../src/utils/response.js";

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
    authenticateRequest(req);

    const ip = req.headers["x-forwarded-for"] as string | undefined;
    checkRateLimit(getRateLimitIdentifier(ip));

    const { q, category } = req.query;

    if (category && !q) {
      const entries = await knowledgeService.getByCategory(category as string);
      sendSuccess(res, { entries, count: entries.length }, requestId);
      return;
    }

    if (!q) {
      const categories = await knowledgeService.listCategories();
      sendSuccess(res, { categories }, requestId);
      return;
    }

    logger.info("Knowledge search", { requestId, query: q });
    const results = await knowledgeService.search(
      q as string,
      category as string | undefined,
    );
    sendSuccess(res, { results, count: results.length }, requestId);
  } catch (error) {
    sendError(res, error, requestId);
  }
}
