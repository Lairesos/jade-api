export type JadeIntent =
  | "schedule_meeting"
  | "create_task"
  | "update_task"
  | "query_knowledge"
  | "execute_operation"
  | "generate_report"
  | "general_inquiry";

export type JadePriority = "low" | "medium" | "high" | "critical";

export type JadeTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "blocked";

export interface JadeMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface JadeRequest {
  message: string;
  context?: JadeContext;
  conversationId?: string;
  intent?: JadeIntent;
}

export interface JadeContext {
  userId?: string;
  userName?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

export interface JadeResponse {
  message: string;
  intent: JadeIntent;
  actions: JadeAction[];
  conversationId: string;
  metadata?: Record<string, unknown>;
}

export interface JadeAction {
  type: string;
  status: "success" | "failed" | "pending";
  description: string;
  result?: unknown;
  error?: string;
}

export interface JadeTask {
  id: string;
  title: string;
  description?: string;
  status: JadeTaskStatus;
  priority: JadePriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  notionPageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JadeOperation {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  steps: JadeOperationStep[];
  startedAt?: string;
  completedAt?: string;
}

export interface JadeOperationStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: unknown;
  error?: string;
}

export interface JadeStatus {
  name: string;
  role: string;
  version: string;
  status: "online" | "degraded" | "offline";
  integrations: IntegrationHealth[];
  uptime: string;
}

export interface IntegrationHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  lastChecked: string;
}
