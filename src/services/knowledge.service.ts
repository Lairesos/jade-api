import { queryDatabase } from "../integrations/notion/databases.js";
import { getKnowledgeDatabaseId } from "../integrations/notion/client.js";
import { logger } from "../utils/logger.js";
import type { NotionKnowledgeEntry } from "../types/notion.types.js";

export class KnowledgeService {
  async search(query: string, category?: string): Promise<NotionKnowledgeEntry[]> {
    const databaseId = getKnowledgeDatabaseId();

    const filter: Record<string, unknown> = {
      or: [
        {
          property: "Name",
          title: { contains: query },
        },
        {
          property: "Content",
          rich_text: { contains: query },
        },
      ],
    };

    if (category) {
      return this.searchWithCategory(databaseId, query, category);
    }

    const { pages } = await queryDatabase({ databaseId, filter });

    logger.debug("Knowledge search completed", {
      service: "knowledge",
      query,
      resultCount: pages.length,
    });

    return pages.map(mapPageToKnowledgeEntry);
  }

  async getByCategory(category: string): Promise<NotionKnowledgeEntry[]> {
    const databaseId = getKnowledgeDatabaseId();

    const { pages } = await queryDatabase({
      databaseId,
      filter: {
        property: "Category",
        select: { equals: category },
      },
    });

    return pages.map(mapPageToKnowledgeEntry);
  }

  async listCategories(): Promise<string[]> {
    const databaseId = getKnowledgeDatabaseId();
    const { pages } = await queryDatabase({ databaseId, pageSize: 100 });

    const categories = new Set<string>();
    for (const page of pages) {
      const category = extractSelectProperty(page.properties, "Category");
      if (category) categories.add(category);
    }

    return Array.from(categories).sort();
  }

  private async searchWithCategory(
    databaseId: string,
    query: string,
    category: string,
  ): Promise<NotionKnowledgeEntry[]> {
    const { pages } = await queryDatabase({
      databaseId,
      filter: {
        and: [
          {
            or: [
              { property: "Name", title: { contains: query } },
              { property: "Content", rich_text: { contains: query } },
            ],
          },
          {
            property: "Category",
            select: { equals: category },
          },
        ],
      },
    });

    return pages.map(mapPageToKnowledgeEntry);
  }
}

function mapPageToKnowledgeEntry(page: {
  id: string;
  title: string;
  properties: Record<string, unknown>;
  lastEditedTime: string;
}): NotionKnowledgeEntry {
  return {
    id: page.id,
    title: page.title,
    content: extractTextProperty(page.properties, "Content") ?? "",
    category: extractSelectProperty(page.properties, "Category"),
    tags: extractMultiSelectProperty(page.properties, "Tags"),
    lastUpdated: page.lastEditedTime,
  };
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
  return prop?.rich_text?.map((t) => t.plain_text ?? "").join("");
}

function extractMultiSelectProperty(
  properties: Record<string, unknown>,
  name: string,
): string[] {
  const prop = properties[name] as {
    multi_select?: Array<{ name?: string }>;
  } | undefined;
  return prop?.multi_select?.map((s) => s.name ?? "").filter(Boolean) ?? [];
}

export const knowledgeService = new KnowledgeService();
