export interface NotionDatabaseQuery {
  databaseId: string;
  filter?: NotionFilter;
  sorts?: NotionSort[];
  pageSize?: number;
  startCursor?: string;
}

export interface NotionFilter {
  property?: string;
  type?: string;
  [key: string]: unknown;
}

export interface NotionSort {
  property: string;
  direction: "ascending" | "descending";
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  properties: Record<string, unknown>;
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionTaskProperties {
  title: string;
  status: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  description?: string;
  tags?: string[];
}

export interface CreateNotionPageInput {
  databaseId: string;
  properties: NotionTaskProperties;
}

export interface UpdateNotionPageInput {
  pageId: string;
  properties: Partial<NotionTaskProperties>;
}

export interface NotionKnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  lastUpdated: string;
}
