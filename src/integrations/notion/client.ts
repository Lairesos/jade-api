import { Client } from "@notionhq/client";
import { getEnv } from "../../config/env.js";

let client: Client | null = null;

export function getNotionClient(): Client {
  if (!client) {
    const env = getEnv();
    client = new Client({ auth: env.NOTION_API_KEY });
  }
  return client;
}

export function resetNotionClient(): void {
  client = null;
}

export function getTasksDatabaseId(): string {
  const id = getEnv().NOTION_TASKS_DATABASE_ID;
  if (!id) throw new Error("NOTION_TASKS_DATABASE_ID is not configured");
  return id;
}

export function getKnowledgeDatabaseId(): string {
  const id = getEnv().NOTION_KNOWLEDGE_DATABASE_ID;
  if (!id) throw new Error("NOTION_KNOWLEDGE_DATABASE_ID is not configured");
  return id;
}

export function getOperationsDatabaseId(): string {
  const id = getEnv().NOTION_OPERATIONS_DATABASE_ID;
  if (!id) throw new Error("NOTION_OPERATIONS_DATABASE_ID is not configured");
  return id;
}
