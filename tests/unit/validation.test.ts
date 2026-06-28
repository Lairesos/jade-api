import { describe, it, expect } from "vitest";
import {
  jadeRequestSchema,
  createTaskSchema,
  createEventSchema,
  makeWebhookSchema,
} from "../../src/utils/validation.js";

describe("jadeRequestSchema", () => {
  it("validates a valid request", () => {
    const result = jadeRequestSchema.safeParse({
      message: "Agende uma reunião amanhã às 10h",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = jadeRequestSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional context", () => {
    const result = jadeRequestSchema.safeParse({
      message: "Olá Jade",
      context: { userName: "Laires", timezone: "America/Sao_Paulo" },
    });
    expect(result.success).toBe(true);
  });
});

describe("createTaskSchema", () => {
  it("validates task with required fields", () => {
    const result = createTaskSchema.safeParse({ title: "Revisar relatório" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("validates task with all fields", () => {
    const result = createTaskSchema.safeParse({
      title: "Deploy produção",
      description: "Deploy da v2.0",
      priority: "critical",
      assignee: "DevOps",
      dueDate: "2026-07-01T00:00:00.000Z",
      tags: ["deploy", "production"],
    });
    expect(result.success).toBe(true);
  });
});

describe("createEventSchema", () => {
  it("validates calendar event", () => {
    const result = createEventSchema.safeParse({
      title: "Standup",
      start: { dateTime: "2026-06-28T09:00:00-03:00" },
      end: { dateTime: "2026-06-28T09:30:00-03:00" },
    });
    expect(result.success).toBe(true);
  });
});

describe("makeWebhookSchema", () => {
  it("validates webhook payload", () => {
    const result = makeWebhookSchema.safeParse({
      event: "task.created",
      timestamp: "2026-06-27T12:00:00.000Z",
      data: { taskId: "abc123", title: "Nova tarefa" },
    });
    expect(result.success).toBe(true);
  });
});
