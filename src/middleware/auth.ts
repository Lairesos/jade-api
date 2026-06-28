import type { VercelRequest } from "@vercel/node";
import { AppError } from "../core/errors/AppError.js";
import { getEnv } from "../config/env.js";
import { timingSafeEqual } from "node:crypto";

export function authenticateRequest(req: VercelRequest): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw AppError.unauthorized("Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw AppError.unauthorized("Invalid Authorization format. Use: Bearer <token>");
  }

  const env = getEnv();
  const expected = env.JADE_API_SECRET;

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  if (
    tokenBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(tokenBuffer, expectedBuffer)
  ) {
    throw AppError.unauthorized("Invalid API token");
  }
}

export function authenticateWebhook(req: VercelRequest): void {
  const signature = req.headers["x-jade-signature"] as string | undefined;
  const webhookSecret = getEnv().JADE_WEBHOOK_SECRET;

  if (!signature) {
    throw AppError.unauthorized("Missing webhook signature");
  }

  const sigBuffer = Buffer.from(signature);
  const secretBuffer = Buffer.from(webhookSecret);

  if (
    sigBuffer.length !== secretBuffer.length ||
    !timingSafeEqual(sigBuffer, secretBuffer)
  ) {
    throw AppError.unauthorized("Invalid webhook signature");
  }
}

export function extractUserId(req: VercelRequest): string | undefined {
  return req.headers["x-user-id"] as string | undefined;
}
