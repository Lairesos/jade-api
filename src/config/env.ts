import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  JADE_API_SECRET: z.string().min(32, "JADE_API_SECRET must be at least 32 characters"),
  JADE_WEBHOOK_SECRET: z.string().min(16, "JADE_WEBHOOK_SECRET must be at least 16 characters"),

  OPENAI_API_KEY: z.string().startsWith("sk-", "Invalid OpenAI API key format"),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(4096),

  NOTION_API_KEY: z.string().startsWith("secret_", "Invalid Notion API key format"),
  NOTION_TASKS_DATABASE_ID: z.string().optional(),
  NOTION_KNOWLEDGE_DATABASE_ID: z.string().optional(),
  NOTION_OPERATIONS_DATABASE_ID: z.string().optional(),

  GOOGLE_CLIENT_EMAIL: z.string().email("Invalid Google service account email"),
  GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY is required"),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),

  MAKE_WEBHOOK_URL: z.string().url("Invalid Make webhook URL").optional(),
  MAKE_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}
