import { describe, it, expect } from "vitest";
import {
  JADE_IDENTITY,
  API_VERSION,
  MAKE_EVENT_TYPES,
} from "../../src/config/constants.js";

describe("constants", () => {
  it("defines Jade identity", () => {
    expect(JADE_IDENTITY.name).toBe("Jade");
    expect(JADE_IDENTITY.role).toBe("Diretora de Operações IA");
    expect(JADE_IDENTITY.version).toBe("1.0.0");
  });

  it("defines API version", () => {
    expect(API_VERSION).toBe("v1");
  });

  it("defines Make event types", () => {
    expect(MAKE_EVENT_TYPES.TASK_CREATED).toBe("task.created");
    expect(MAKE_EVENT_TYPES.MEETING_SCHEDULED).toBe("meeting.scheduled");
    expect(MAKE_EVENT_TYPES.ALERT_RAISED).toBe("alert.raised");
  });
});
