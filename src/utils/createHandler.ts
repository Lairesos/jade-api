import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../middleware/cors.js";
import { generateRequestId, logger } from "./logger.js";
import { sendError } from "./response.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HandlerContext {
  req: VercelRequest;
  res: VercelResponse;
  requestId: string;
}

export interface HandlerOptions {
  methods: HttpMethod[];
  auth?: boolean;
  webhook?: boolean;
  rateLimit?: boolean;
  handler: (ctx: HandlerContext) => Promise<void>;
}

export function createHandler(options: HandlerOptions) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const requestId =
      (req.headers["x-request-id"] as string | undefined) ??
      generateRequestId();

    if (applyCors(req, res)) return;

    if (!options.methods.includes(req.method as HttpMethod)) {
      res.status(405).json({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: `Method ${req.method} not allowed. Allowed: ${options.methods.join(", ")}`,
        },
      });
      return;
    }

    try {
      await options.handler({ req, res, requestId });
    } catch (error) {
      logger.error("Handler error", {
        requestId,
        path: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : "unknown",
      });
      sendError(res, error, requestId);
    }
  };
}
