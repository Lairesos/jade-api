import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  clearRateLimitStore,
  getRateLimitIdentifier,
} from "../../src/middleware/rateLimit.js";
import { AppError } from "../../src/core/errors/AppError.js";

describe("rateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("allows requests within limit", () => {
    expect(() => checkRateLimit("test-user")).not.toThrow();
  });

  it("blocks requests exceeding limit", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit("test-user");
    }
    expect(() => checkRateLimit("test-user")).toThrow(AppError);
  });

  it("tracks different identifiers separately", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit("user-a");
    }
    expect(() => checkRateLimit("user-b")).not.toThrow();
  });

  it("generates identifier from userId or ip", () => {
    expect(getRateLimitIdentifier("1.2.3.4", "user-123")).toBe("user-123");
    expect(getRateLimitIdentifier("1.2.3.4")).toBe("1.2.3.4");
    expect(getRateLimitIdentifier(undefined)).toBe("anonymous");
  });
});
