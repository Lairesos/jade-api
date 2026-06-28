import { describe, it, expect } from "vitest";
import { generateRequestId } from "../../src/utils/logger.js";

describe("generateRequestId", () => {
  it("generates unique ids with jade prefix", () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).toMatch(/^jade_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^jade_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});
