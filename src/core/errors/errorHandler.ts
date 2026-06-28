import { AppError } from "./AppError.js";
import type { ApiResponse } from "../../types/common.types.js";
import { API_VERSION } from "../../config/constants.js";
import { logger } from "../../utils/logger.js";

export function handleError(error: unknown, requestId: string): ApiResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error("Non-operational error", {
        requestId,
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
    } else {
      logger.warn("Operational error", {
        requestId,
        code: error.code,
        message: error.message,
      });
    }

    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: { requestId, timestamp, version: API_VERSION },
    };
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error("Unhandled error", {
    requestId,
    message,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    meta: { requestId, timestamp, version: API_VERSION },
  };
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}
