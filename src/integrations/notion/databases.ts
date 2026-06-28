import type {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { getNotionClient } from "./client.js";
import { NOTION_PAGE_SIZE } from "../../config/constants.js";
import { IntegrationError } from "../../core/errors/AppError.js";
import { logger } from "../../utils/logger.js";
import type {
  NotionDatabaseQuery,
  NotionPage,
} from "../../types/notion.types.js";

export async function queryDatabase(
  query: NotionDatabaseQuery,
): Promise<{ pages: NotionPage[]; hasMore: boolean; nextCursor?: string }> {
  const client = getNotionClient();

  try {
    const params: QueryDatabaseParameters = {
      database_id: query.databaseId,
      page_size: query.pageSize ?? NOTION_PAGE_SIZE,
      start_cursor: query.startCursor,
    };

    if (query.filter) {
      params.filter = query.filter as QueryDatabaseParameters["filter"];
    }

    if (query.sorts) {
      params.sorts = query.sorts as QueryDatabaseParameters["sorts"];
    }

    const response: QueryDatabaseResponse =
      await client.databases.query(params);

    const pages = response.results
      .filter((r) => r.object === "page")
      .map(mapNotionPage);

    logger.debug("Notion database queried", {
      service: "notion",
      databaseId: query.databaseId,
      resultCount: pages.length,
    });

    return {
      pages,
      hasMore: response.has_more,
      nextCursor: response.next_cursor ?? undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Notion error";
    logger.error("Notion query failed", { service: "notion", message });
    throw new IntegrationError("notion", `Database query failed: ${message}`);
  }
}

function mapNotionPage(page: QueryDatabaseResponse["results"][number]): NotionPage {
  const props = "properties" in page ? page.properties : {};
  const title = extractTitle(props);

  return {
    id: page.id,
    title,
    url: "url" in page ? (page.url ?? "") : "",
    properties: props as Record<string, unknown>,
    createdTime: "created_time" in page ? page.created_time : "",
    lastEditedTime: "last_edited_time" in page ? page.last_edited_time : "",
  };
}

function extractTitle(properties: Record<string, unknown>): string {
  for (const prop of Object.values(properties)) {
    if (
      prop &&
      typeof prop === "object" &&
      "type" in prop &&
      prop.type === "title" &&
      "title" in prop &&
      Array.isArray(prop.title)
    ) {
      return prop.title
        .map((t: { plain_text?: string }) => t.plain_text ?? "")
        .join("");
    }
  }
  return "Untitled";
}

export async function getDatabaseSchema(databaseId: string): Promise<unknown> {
  const client = getNotionClient();

  try {
    return await client.databases.retrieve({ database_id: databaseId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Notion error";
    throw new IntegrationError("notion", `Failed to retrieve database schema: ${message}`);
  }
}
