import { getNotionClient } from "./client.js";
import { IntegrationError } from "../../core/errors/AppError.js";
import { logger } from "../../utils/logger.js";
import type {
  CreateNotionPageInput,
  NotionPage,
  NotionTaskProperties,
  UpdateNotionPageInput,
} from "../../types/notion.types.js";

export async function createPage(input: CreateNotionPageInput): Promise<NotionPage> {
  const client = getNotionClient();

  try {
    const response = await client.pages.create({
      parent: { database_id: input.databaseId },
      properties: buildNotionProperties(input.properties),
    });

    logger.info("Notion page created", {
      service: "notion",
      pageId: response.id,
      title: input.properties.title,
    });

    return {
      id: response.id,
      title: input.properties.title,
      url: "url" in response ? (response.url ?? "") : "",
      properties: input.properties as unknown as Record<string, unknown>,
      createdTime: "",
      lastEditedTime: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Notion error";
    logger.error("Notion page creation failed", { service: "notion", message });
    throw new IntegrationError("notion", `Page creation failed: ${message}`);
  }
}

export async function updatePage(input: UpdateNotionPageInput): Promise<NotionPage> {
  const client = getNotionClient();

  try {
    const response = await client.pages.update({
      page_id: input.pageId,
      properties: buildNotionProperties(input.properties),
    });

    logger.info("Notion page updated", {
      service: "notion",
      pageId: input.pageId,
    });

    return {
      id: response.id,
      title: input.properties.title ?? "Updated",
      url: "url" in response ? (response.url ?? "") : "",
      properties: input.properties as unknown as Record<string, unknown>,
     createdTime: "",
      lastEditedTime: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Notion error";
    throw new IntegrationError("notion", `Page update failed: ${message}`);
  }
}

export async function getPage(pageId: string): Promise<NotionPage> {
  const client = getNotionClient();

  try {
    const response = await client.pages.retrieve({ page_id: pageId });

    return {
      id: response.id,
      title: "Untitled",
      url: "url" in response ? (response.url ?? "") : "",
      properties: "properties" in response
        ? (response.properties as Record<string, unknown>)
        : {},
      createdTime: "",
      lastEditedTime: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Notion error";
    throw new IntegrationError("notion", `Page retrieval failed: ${message}`);
  }
}

export async function archivePage(pageId: string): Promise<void> {
  const client = getNotionClient();

  try {
    await client.pages.update({ page_id: pageId, archived: true });
    logger.info("Notion page archived", { service: "notion", pageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Notion error";
    throw new IntegrationError("notion", `Page archive failed: ${message}`);
  }
}

function buildNotionProperties(
  props: Partial<NotionTaskProperties>,
): Record<string, any> {
  const notionProps: Record<string, any> = {};

  if (props.title !== undefined) {
    notionProps["Name"] = {
      title: [{ text: { content: props.title } }],
    };
  }

  if (props.status !== undefined) {
    notionProps["Status"] = { select: { name: props.status } };
  }

  if (props.priority !== undefined) {
    notionProps["Priority"] = { select: { name: props.priority } };
  }

  if (props.assignee !== undefined) {
    notionProps["Assignee"] = {
      rich_text: [{ text: { content: props.assignee } }],
    };
  }

  if (props.dueDate !== undefined) {
    notionProps["Due Date"] = { date: { start: props.dueDate } };
  }

  if (props.description !== undefined) {
    notionProps["Description"] = {
      rich_text: [{ text: { content: props.description } }],
    };
  }

  if (props.tags !== undefined) {
    notionProps["Tags"] = {
      multi_select: props.tags.map((tag) => ({ name: tag })),
    };
  }

  return notionProps;
}
