import type { VercelResponse } from "@vercel/node";
import type { ApiResponse } from "../types/common.types.js";
import { API_VERSION } from "../config/constants.js";
import { getErrorStatusCode } from "../core/errors/errorHandler.js";
import { AppError } from "../core/errors/AppError.js";

export function sendSuccess<T>(
  res: VercelResponse,
  data: T,
  requestId: string,
  statusCode = 200,
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  };

  res.status(statusCode).json(response);
}

export function sendError(
  res: VercelResponse,
  error: unknown,
  requestId: string,
): void {
  const statusCode = getErrorStatusCode(error);

  const response: ApiResponse = {
    success: false,
    error: {
      code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      message:
        error instanceof AppError
          ? error.message
          : "An unexpected error occurred",
      details: error instanceof AppError ? error.details : undefined,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  };

  res.status(statusCode).json(response);
}

export function sendNoContent(res: VercelResponse): void {
  res.status(204).end();
}
