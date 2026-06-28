import { JADE_IDENTITY } from "../config/constants.js";
import { getOpenAIClient } from "../integrations/openai/client.js";
import { getNotionClient } from "../integrations/notion/client.js";
import { getCalendarClient } from "../integrations/google-calendar/client.js";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { IntegrationHealth, JadeStatus } from "../types/jade.types.js";

export class HealthService {
  async getStatus(): Promise<JadeStatus> {
    const integrations = await Promise.all([
      this.checkOpenAI(),
      this.checkNotion(),
      this.checkGoogleCalendar(),
      this.checkMake(),
    ]);

    const unhealthyCount = integrations.filter((i) => i.status === "unhealthy").length;
    const degradedCount = integrations.filter((i) => i.status === "degraded").length;

    let status: JadeStatus["status"] = "online";
    if (unhealthyCount > 0) status = "offline";
    else if (degradedCount > 0) status = "degraded";

    return {
      name: JADE_IDENTITY.name,
      role: JADE_IDENTITY.role,
      version: JADE_IDENTITY.version,
      status,
      integrations,
      uptime: process.uptime().toFixed(0) + "s",
    };
  }

  private async checkOpenAI(): Promise<IntegrationHealth> {
    const start = Date.now();
    try {
      getOpenAIClient();
      getEnv();
      return {
        name: "openai",
        status: "healthy",
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("OpenAI health check failed", {
        service: "health",
        error: error instanceof Error ? error.message : "unknown",
      });
      return {
        name: "openai",
        status: "unhealthy",
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkNotion(): Promise<IntegrationHealth> {
    const start = Date.now();
    try {
      const client = getNotionClient();
      await client.users.me({});
      return {
        name: "notion",
        status: "healthy",
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: "notion",
        status: "degraded",
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkGoogleCalendar(): Promise<IntegrationHealth> {
    const start = Date.now();
    try {
      getCalendarClient();
      getEnv();
      return {
        name: "google-calendar",
        status: "healthy",
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: "google-calendar",
        status: "unhealthy",
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkMake(): Promise<IntegrationHealth> {
    const env = getEnv();
    const configured = Boolean(env.MAKE_WEBHOOK_URL);

    return {
      name: "make",
      status: configured ? "healthy" : "degraded",
      lastChecked: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
