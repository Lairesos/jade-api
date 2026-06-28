import { z } from "zod";
import { ValidationError } from "../core/errors/AppError.js";

export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
  label = "Request body",
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new ValidationError(`${label} validation failed`, details);
  }

  return result.data;
}

export function parseJsonBody<T>(body: string | undefined | null): T {
  if (!body) {
    throw new ValidationError("Request body is required");
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }
}

export const jadeRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(10000),
  context: z
    .object({
      userId: z.string().optional(),
      userName: z.string().optional(),
      timezone: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .optional(),
  conversationId: z.string().optional(),
  intent: z
    .enum([
      "schedule_meeting",
      "create_task",
      "update_task",
      "query_knowledge",
      "execute_operation",
      "generate_report",
      "general_inquiry",
    ])
    .optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignee: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  start: z.object({
    dateTime: z.string().datetime().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().datetime().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        displayName: z.string().optional(),
      }),
    )
    .optional(),
  location: z.string().optional(),
  sendNotifications: z.boolean().default(true),
});

export const makeWebhookSchema = z.object({
  event: z.string().min(1),
  timestamp: z.string(),
  data: z.record(z.unknown()),
  source: z.string().optional(),
});
