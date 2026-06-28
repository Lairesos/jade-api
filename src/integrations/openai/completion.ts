import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions.js";
import { getOpenAIClient } from "./client.js";
import { getEnv } from "../../config/env.js";
import { OPENAI_DEFAULTS } from "../../config/constants.js";
import { IntegrationError } from "../../core/errors/AppError.js";
import { logger } from "../../utils/logger.js";

export interface CompletionOptions {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  toolChoice?: "auto" | "none" | "required";
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string | null;
  toolCalls: ToolCallResult[];
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ToolCallResult {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export async function createCompletion(
  options: CompletionOptions,
): Promise<CompletionResult> {
  const env = getEnv();
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: options.messages,
      tools: options.tools,
      tool_choice: options.toolChoice ?? (options.tools ? "auto" : undefined),
      temperature: options.temperature ?? OPENAI_DEFAULTS.TEMPERATURE,
      max_tokens: options.maxTokens ?? env.OPENAI_MAX_TOKENS,
      top_p: OPENAI_DEFAULTS.TOP_P,
      frequency_penalty: OPENAI_DEFAULTS.FREQUENCY_PENALTY,
      presence_penalty: OPENAI_DEFAULTS.PRESENCE_PENALTY,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new IntegrationError("openai", "No completion choice returned");
    }

    const toolCalls: ToolCallResult[] = (choice.message.tool_calls ?? []).map(
      (tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      }),
    );

    logger.debug("OpenAI completion", {
      service: "openai",
      model: env.OPENAI_MODEL,
      finishReason: choice.finish_reason,
      toolCallCount: toolCalls.length,
      tokens: response.usage?.total_tokens,
    });

    return {
      content: choice.message.content,
      toolCalls,
      finishReason: choice.finish_reason ?? "unknown",
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof IntegrationError) throw error;

    const message = error instanceof Error ? error.message : "Unknown OpenAI error";
    logger.error("OpenAI completion failed", { service: "openai", message });
    throw new IntegrationError("openai", `Completion failed: ${message}`);
  }
}

export function buildToolResultMessage(
  toolCallId: string,

  result: unknown,
): ChatCompletionToolMessageParam {
  return {
    role: "tool",
    tool_call_id: toolCallId,
    content: JSON.stringify(result),
  };
}
