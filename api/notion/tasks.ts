import type { VercelRequest, VercelResponse } from "@vercel/node";
import { operationsService } from "../../src/services/operations.service.js";
import { authenticateRequest } from "../../src/middleware/auth.js";
import { applyCors } from "../../src/middleware/cors.js";
import { checkRateLimit, getRateLimitIdentifier } from "../../src/middleware/rateLimit.js";
import { generateRequestId, logger } from "../../src/utils/logger.js";
import { sendSuccess, sendError } from "../../src/utils/response.js";
import { parseJsonBody, validate, createTaskSchema } from "../../src/utils/validation.js";
import { z } from "zod";

const updateTaskSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const requestId = generateRequestId();

  if (applyCors(req, res)) return;

  const ip = req.headers["x-forwarded-for"] as string | undefined;

  try {
    authenticateRequest(req);
    checkRateLimit(getRateLimitIdentifier(ip));

    switch (req.method) {
      case "GET": {
        const { status, priority, assignee } = req.query;
        const tasks = await operationsService.listTasks({
          status: status as string | undefined,
          priority: priority as string | undefined,
          assignee: assignee as string | undefined,
        });
        sendSuccess(res, { tasks, count: tasks.length }, requestId);
        break;
      }

      case "POST": {
        const body = parseJsonBody(req.body);
        const input = validate(createTaskSchema, body);
        logger.info("Creating task via API", { requestId, title: input.title });
        const task = await operationsService.createTask(input);
        sendSuccess(res, task, requestId, 201);
        break;
      }

      case "PATCH": {
        const body = parseJsonBody(req.body);
        const input = validate(updateTaskSchema, body);
        logger.info("Updating task via API", { requestId, pageId: input.pageId });
        const task = await operationsService.updateTask(input.pageId, input);
        sendSuccess(res, task, requestId);
        break;
      }

      default:
        res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    sendError(res, error, requestId);
  }
}
