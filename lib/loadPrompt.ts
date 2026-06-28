import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(__dirname, "..", "prompts");

export const PROMPT_NAMES = {
  SYSTEM: "system",
  INTENT_DETECTION: "intent-detection",
  CONTEXT_TEMPLATE: "context-template",
} as const;

export type PromptName = (typeof PROMPT_NAMES)[keyof typeof PROMPT_NAMES];

const cache = new Map<string, string>();

export function loadPrompt(name: PromptName): string {
  const cached = cache.get(name);
  if (cached) return cached;

  const filePath = join(PROMPTS_DIR, `${name}.md`);
  const content = readFileSync(filePath, "utf-8").trim();
  cache.set(name, content);
  return content;
}

export function loadAllPrompts(): Record<PromptName, string> {
  const files = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith(".md"));
  const result = {} as Record<PromptName, string>;

  for (const file of files) {
    const name = file.replace(/\.md$/, "") as PromptName;
    result[name] = loadPrompt(name);
  }

  return result;
}

export function clearPromptCache(): void {
  cache.clear();
}
