import OpenAI from "openai";
import { getEnv } from "../../config/env.js";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const env = getEnv();
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export function resetOpenAIClient(): void {
  client = null;
}
