import { createPage, updatePage } from "../integrations/notion/pages.js";
import { queryDatabase } from "../integrations/notion/databases.js";
import { getTasksDatabaseId } from "../integrations/notion/client.js";
import { triggerTaskCreated, triggerTaskCompleted } from "../integrations/make/triggers.js";
import { logger } from "../utils/logger.js";
import type { JadePriority, JadeTask, JadeTaskStatus } from "../types/jade.types.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: JadePriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

export interface ListTasksFilter {
  status?: string;
  priority?: string;
  assignee?: string;
}

export class OperationsService {
  async createTask(input: CreateTaskInput): Promise<JadeTask> {
    const databaseId = getTasksDatabaseId();

    const page = await createPage({
      databaseId,
      properties: {
        title: input.title,
        description: input.description,
        status: "pending",
        priority: input.priority ?? "medium",
        assignee: input.assignee,
        dueDate: input.dueDate,
        tags: input.tags,
      },
    });

    const task = mapPageToTask(page);

    await triggerTaskCreated({
      id: task.id,
      title: task.title,
      priority: task.priority,
      assignee: task.assignee,
    }).catch((err) => {
      logger.warn("Failed to trigger Make on task creation", {
        service: "operations",
        error: err instanceof Error ? err.message : "unknown",
      });
    });

    return task;
  }

  async updateTask(
    pageId: string,
    updates: Partial<{
      title: string;
      status: string;
      priority: string;
      assignee: string;
      dueDate: string;
    }>,
  ): Promise<JadeTask> {
    const page = await updatePage({ pageId, properties: updates });
    const task = mapPageToTask(page);

    if (updates.status === "completed") {
      await triggerTaskCompleted({
        id: task.id,
        title: task.title,
        completedAt: new Date().toISOString(),
      }).catch((err) => {
        logger.warn("Failed to trigger Make on task completion", {
          service: "operations",
          error: err instanceof Error ? err.message : "unknown",
        });
      });
    }

    return task;
  }

  async listTasks(filter: ListTasksFilter = {}): Promise<JadeTask[]> {
    const databaseId = getTasksDatabaseId();
    const notionFilter = buildNotionFilter(filter);

    const { pages } = await queryDatabase({
      databaseId,
      filter: notionFilter,
      sorts: [{ property: "Due Date", direction: "ascending" }],
    });

    return pages.map(mapPageToTask);
  }

  async getTask(pageId: string): Promise<JadeTask | null> {
    const { pages } = await queryDatabase({
      databaseId: getTasksDatabaseId(),
      filter: {
        property: "id",
        rich_text: { equals: pageId },
      },
    });

    const page = pages[0];
    return page ? mapPageToTask(page) : null;
  }
}

function mapPageToTask(page: {
  id: string;
  title: string;
  properties: Record<string, unknown>;
  createdTime: string;
  lastEditedTime: string;
}): JadeTask {
  return {
    id: page.id,
    title: page.title,
    status: extractSelectProperty(page.properties, "Status") as JadeTaskStatus ?? "pending",
    priority: extractSelectProperty(page.properties, "Priority") as JadePriority ?? "medium",
    assignee: extractTextProperty(page.properties, "Assignee"),
    dueDate: extractDateProperty(page.properties, "Due Date"),
    notionPageId: page.id,
    createdAt: page.createdTime,
    updatedAt: page.lastEditedTime,
  };
}

function buildNotionFilter(filter: ListTasksFilter): Record<string, unknown> | undefined {
  const conditions: Record<string, unknown>[] = [];

  if (filter.status) {
    conditions.push({
      property: "Status",
      select: { equals: filter.status },
    });
  }

  if (filter.priority) {
    conditions.push({
      property: "Priority",
      select: { equals: filter.priority },
    });
  }

  if (filter.assignee) {
    conditions.push({
      property: "Assignee",
      rich_text: { contains: filter.assignee },
    });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];

  return { and: conditions };
}

function extractSelectProperty(
  properties: Record<string, unknown>,
  name: string,
): string | undefined {
  const prop = properties[name] as { select?: { name?: string } } | undefined;
  return prop?.select?.name;
}

function extractTextProperty(
  properties: Record<string, unknown>,
  name: string,
): string | undefined {
  const prop = properties[name] as {
    rich_text?: Array<{ plain_text?: string }>;
  } | undefined;
  return prop?.rich_text?.[0]?.plain_text;
}

function extractDateProperty(
  properties: Record<string, unknown>,
  name: string,
): string | undefined {
  const prop = properties[name] as { date?: { start?: string } } | undefined;
  return prop?.date?.start;
}

export const operationsService = new OperationsService();
