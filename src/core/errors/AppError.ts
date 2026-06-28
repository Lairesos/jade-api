export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): AppError {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN"): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND"): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message: string, code = "CONFLICT"): AppError {
    return new AppError(message, 409, code);
  }

  static tooManyRequests(message = "Too many requests", code = "RATE_LIMIT_EXCEEDED"): AppError {
    return new AppError(message, 429, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR"): AppError {
    return new AppError(message, 500, code, undefined, false);
  }

  static serviceUnavailable(message: string, code = "SERVICE_UNAVAILABLE"): AppError {
    return new AppError(message, 503, code);
  }
}

export class IntegrationError extends AppError {
  public readonly integration: string;

  constructor(integration: string, message: string, details?: unknown) {
    super(message, 502, "INTEGRATION_ERROR", details);
    this.name = "IntegrationError";
    this.integration = integration;
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
