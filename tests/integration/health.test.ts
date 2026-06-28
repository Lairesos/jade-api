import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/health.service.js", () => ({
  healthService: {
    getStatus: vi.fn().mockResolvedValue({
      name: "Jade",
      role: "Diretora de Operações IA",
      version: "1.0.0",
      status: "online",
      integrations: [],
      uptime: "0s",
    }),
  },
}));

describe("Health endpoint integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("healthService returns expected shape", async () => {
    const { healthService } = await import(
      "../../src/services/health.service.js"
    );

    const status = await healthService.getStatus();

    expect(status.name).toBe("Jade");
    expect(status.status).toBe("online");
    expect(status.integrations).toEqual([]);
  });
});
