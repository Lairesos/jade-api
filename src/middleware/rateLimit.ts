import { AppError } from "../core/errors/AppError.js";
import { RATE_LIMIT } from "../config/constants.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(identifier: string): void {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT.WINDOW_MS,
    });
    return;
  }

  if (entry.count >= RATE_LIMIT.MAX_REQUESTS) {
    throw AppError.tooManyRequests(
      `Rate limit exceeded. Max ${RATE_LIMIT.MAX_REQUESTS} requests per minute.`,
    );
  }

  entry.count++;
}

export function getRateLimitIdentifier(
  ip: string | undefined,
  userId?: string,
): string {
  return userId ?? ip ?? "anonymous";
}

export function clearRateLimitStore(): void {
  store.clear();
}
