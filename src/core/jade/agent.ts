import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";
import { createCompletion, buildToolResultMessage } from "../../integrations/openai/completion.js";
import { JADE_SYSTEM_PROMPT, buildContextPrompt } from "./prompts.js";
import { JADE_TOOLS, type JadeToolName } from "./tools.js";
import { operationsService } from "../../services/operations.service.js";
import { schedulingService } from "../../services/scheduling.service.js";
import { knowledgeService } from "../../services/knowledge.service.js";
import { automationService } from "../../services/automation.service.js";
import { generateRequestId, logger } from "../../utils/logger.js";
import type {
  JadeAction,
  JadeIntent,
  JadeRequest,
  JadeResponse,
} from "../../types/jade.types.js";

const MAX_TOOL_ITERATIONS = 5;

export class JadeAgent {
  async process(request: JadeRequest): Promise<JadeResponse> {
    const conversationId = request.conversationId ?? generateRequestId();
    const actions: JadeAction[] = [];

    logger.info("Jade processing request", {
      service: "jade-agent",
      conversationId,
      intent: request.intent,
    });

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: JADE_SYSTEM_PROMPT },
    ];

    const contextPrompt = buildContextPrompt(request.context);
    if (contextPrompt) {
      messages.push({ role: "system", content: contextPrompt });
    }

    messages.push({ role: "user", content: request.message });

    let finalContent = "";
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const completion = await createCompletion({
        messages,
        tools: JADE_TOOLS,
        toolChoice: "auto",
      });

      if (completion.toolCalls.length === 0) {
        finalContent = completion.content ?? "";
        break;
      }

      messages.push({
        role: "assistant",
        content: completion.content,
        tool_calls: completion.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      });

      for (const toolCall of completion.toolCalls) {
        const result = await this.executeTool(
          toolCall.name as JadeToolName,
          toolCall.arguments,
        );

        actions.push({
          type: toolCall.name,
          status: result.success ? "success" : "failed",
          description: result.description,
          result: result.data,
          error: result.error,
        });

        messages.push(
          buildToolResultMessage(toolCall.id, result),
        );
      }
    }

    const intent = this.detectIntent(request, actions);

    return {
      message: finalContent,
      intent,
      actions,
      conversationId,
      metadata: {
        toolIterations: iterations,
        actionCount: actions.length,
      },
    };
  }

  private async executeTool(
    name: JadeToolName,
    args: Record<string, unknown>,
  ): Promise<ToolExecutionResult> {
    try {
      switch (name) {
        case "create_task": {
          const task = await operationsService.createTask({
            title: args["title"] as string,
            description: args["description"] as string | undefined,
            priority: (args["priority"] as "low" | "medium" | "high" | "critical") ?? "medium",
            assignee: args["assignee"] as string | undefined,
            dueDate: args["dueDate"] as string | undefined,
            tags: args["tags"] as string[] | undefined,
          });
          return {
            success: true,
            description: `Tarefa "${task.title}" criada`,
            data: task,
          };
        }

        case "update_task": {
          const task = await operationsService.updateTask(
            args["pageId"] as string,
            {
              title: args["title"] as string | undefined,
              status: args["status"] as string | undefined,
              priority: args["priority"] as string | undefined,
              assignee: args["assignee"] as string | undefined,
              dueDate: args["dueDate"] as string | undefined,
            },
          );
          return {
            success: true,
            description: `Tarefa atualizada`,
            data: task,
          };
        }

        case "list_tasks": {
          const tasks = await operationsService.listTasks({
            status: args["status"] as string | undefined,
            priority: args["priority"] as string | undefined,
            assignee: args["assignee"] as string | undefined,
          });
          return {
            success: true,
            description: `${tasks.length} tarefa(s) encontrada(s)`,
            data: tasks,
          };
        }

        case "schedule_meeting": {
          const event = await schedulingService.scheduleMeeting({
            title: args["title"] as string,
            description: args["description"] as string | undefined,
            startDateTime: args["startDateTime"] as string,
            endDateTime: args["endDateTime"] as string,
            attendees: args["attendees"] as string[] | undefined,
            location: args["location"] as string | undefined,
          });
          return {
            success: true,
            description: `Reunião "${event.title}" agendada`,
            data: event,
          };
        }

        case "list_calendar_events": {
          const events = await schedulingService.listEvents({
            timeMin: args["timeMin"] as string | undefined,
            timeMax: args["timeMax"] as string | undefined,
            query: args["query"] as string | undefined,
          });
          return {
            success: true,
            description: `${events.length} evento(s) encontrado(s)`,
            data: events,
          };
        }

        case "query_knowledge": {
          const results = await knowledgeService.search(
            args["query"] as string,
            args["category"] as string | undefined,
          );
          return {
            success: true,
            description: `${results.length} resultado(s) na base de conhecimento`,
            data: results,
          };
        }

        case "trigger_automation": {
          const result = await automationService.trigger({
            eventType: args["eventType"] as string,
            payload: args["payload"] as Record<string, unknown>,
          });
          return {
            success: result.success,
            description: `Automação "${args["eventType"]}" disparada`,
            data: result,
            error: result.error,
          };
        }

        default:
          return {
            success: false,
            description: `Ferramenta desconhecida: ${name}`,
            error: "UNKNOWN_TOOL",
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed";
      logger.error("Tool execution failed", { service: "jade-agent", tool: name, message });
      return {
        success: false,
        description: `Falha ao executar ${name}`,
        error: message,
      };
    }
  }

  private detectIntent(request: JadeRequest, actions: JadeAction[]): JadeIntent {
    if (request.intent) return request.intent;

    const toolToIntent: Record<string, JadeIntent> = {
      create_task: "create_task",
      update_task: "update_task",
      list_tasks: "query_knowledge",
      schedule_meeting: "schedule_meeting",
      list_calendar_events: "schedule_meeting",
      query_knowledge: "query_knowledge",
      trigger_automation: "execute_operation",
    };

    for (const action of actions) {
      const intent = toolToIntent[action.type];
      if (intent) return intent;
    }

    return "general_inquiry";
  }
}

interface ToolExecutionResult {
  success: boolean;
  description: string;
  data?: unknown;
  error?: string;
}

export const jadeAgent = new JadeAgent();
