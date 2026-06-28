import { describe, it, expect } from "vitest";
import { AppError, ValidationError, IntegrationError } from "../../src/core/errors/AppError.js";

describe("AppError", () => {
  it("creates error with default values", () => {
    const error = new AppError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.isOperational).toBe(true);
  });

  it("creates bad request error", () => {
    const error = AppError.badRequest("Invalid input", "INVALID_INPUT");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INVALID_INPUT");
  });

  it("creates unauthorized error", () => {
    const error = AppError.unauthorized();
    expect(error.statusCode).toBe(401);
  });

  it("creates not found error", () => {
    const error = AppError.notFound("Task not found");
    expect(error.statusCode).toBe(404);
  });

  it("creates rate limit error", () => {
    const error = AppError.tooManyRequests();
    expect(error.statusCode).toBe(429);
  });
});

describe("ValidationError", () => {
  it("has correct status code and code", () => {
    const error = new ValidationError("Validation failed", [{ field: "title" }]);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual([{ field: "title" }]);
  });
});

describe("IntegrationError", () => {
  it("includes integration name", () => {
    const error = new IntegrationError("notion", "Connection failed");
    expect(error.integration).toBe("notion");
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe("INTEGRATION_ERROR");
  });
});
