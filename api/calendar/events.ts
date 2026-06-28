import type { VercelRequest, VercelResponse } from "@vercel/node";
import { schedulingService } from "../../src/services/scheduling.service.js";
import { authenticateRequest } from "../../src/middleware/auth.js";
import { applyCors } from "../../src/middleware/cors.js";
import { checkRateLimit, getRateLimitIdentifier } from "../../src/middleware/rateLimit.js";
import { generateRequestId, logger } from "../../src/utils/logger.js";
import { sendSuccess, sendError } from "../../src/utils/response.js";
import { parseJsonBody, validate, createEventSchema } from "../../src/utils/validation.js";

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
        const { timeMin, timeMax, q, days } = req.query;

        if (days) {
          const events = await schedulingService.getUpcomingEvents(
            parseInt(days as string, 10) || 7,
          );
          sendSuccess(res, { events, count: events.length }, requestId);
          return;
        }

        const events = await schedulingService.listEvents({
          timeMin: timeMin as string | undefined,
          timeMax: timeMax as string | undefined,
          query: q as string | undefined,
        });
        sendSuccess(res, { events, count: events.length }, requestId);
        break;
      }

      case "POST": {
        const body = parseJsonBody(req.body);
        const input = validate(createEventSchema, body);

        logger.info("Creating calendar event", { requestId, title: input.title });

        const event = await schedulingService.scheduleMeeting({
          title: input.title,
          description: input.description,
          startDateTime: input.start.dateTime ?? input.start.date ?? "",
          endDateTime: input.end.dateTime ?? input.end.date ?? "",
          attendees: input.attendees?.map((a) => a.email),
          location: input.location,
        });

        sendSuccess(res, event, requestId, 201);
        break;
      }

      case "DELETE": {
        const eventId = req.query["eventId"] as string;
        if (!eventId) {
          res.status(400).json({ error: "eventId query parameter is required" });
          return;
        }

        await schedulingService.cancelMeeting(eventId);
        sendSuccess(res, { deleted: true, eventId }, requestId);
        break;
      }

      default:
        res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    sendError(res, error, requestId);
  }
}
