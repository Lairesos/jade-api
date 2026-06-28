import type { ChatCompletionTool } from "openai/resources/chat/completions.js";

export const JADE_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma nova tarefa no Notion com título, prioridade, responsável e prazo",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          description: { type: "string", description: "Descrição detalhada" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Prioridade da tarefa",
          },
          assignee: { type: "string", description: "Responsável pela tarefa" },
          dueDate: { type: "string", description: "Data de vencimento (ISO 8601)" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags para categorização",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Atualiza uma tarefa existente no Notion",
      parameters: {
        type: "object",
        properties: {
          pageId: { type: "string", description: "ID da página Notion" },
          title: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "cancelled", "blocked"],
          },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
          assignee: { type: "string" },
          dueDate: { type: "string" },
        },
        required: ["pageId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Lista tarefas do Notion com filtros opcionais",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status" },
          priority: { type: "string", description: "Filtrar por prioridade" },
          assignee: { type: "string", description: "Filtrar por responsável" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_meeting",
      description: "Agenda uma reunião ou evento no Google Calendar",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da reunião" },
          description: { type: "string", description: "Descrição ou pauta" },
          startDateTime: { type: "string", description: "Início (ISO 8601)" },
          endDateTime: { type: "string", description: "Fim (ISO 8601)" },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "Emails dos participantes",
          },
          location: { type: "string", description: "Local ou link da reunião" },
        },
        required: ["title", "startDateTime", "endDateTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "Lista eventos do Google Calendar em um período",
      parameters: {
        type: "object",
        properties: {
          timeMin: { type: "string", description: "Início do período (ISO 8601)" },
          timeMax: { type: "string", description: "Fim do período (ISO 8601)" },
          query: { type: "string", description: "Busca por texto" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_knowledge",
      description: "Consulta a base de conhecimento no Notion",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo ou pergunta de busca" },
          category: { type: "string", description: "Categoria para filtrar" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "trigger_automation",
      description: "Dispara uma automação no Make.com",
      parameters: {
        type: "object",
        properties: {
          eventType: { type: "string", description: "Tipo do evento" },
          payload: {
            type: "object",
            description: "Dados do evento",
          },
        },
        required: ["eventType", "payload"],
      },
    },
  },
];

export type JadeToolName =
  | "create_task"
  | "update_task"
  | "list_tasks"
  | "schedule_meeting"
  | "list_calendar_events"
  | "query_knowledge"
  | "trigger_automation";
