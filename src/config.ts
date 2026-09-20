import "dotenv/config";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
export const OPENAI_EMBEDDING_DIMENSIONS = Number(
  process.env.OPENAI_EMBEDDING_DIMENSIONS ?? "1536",
);
export const MODEL_TEMPERATURE = Number(process.env.MODEL_TEMPERATURE ?? "0");

export const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://ai_cache:ai_cache@localhost:5432/ai_cache";

export type RuntimeConfig = {
  prompt_version: string;
  rules_version: string;
  model_capability: string;
  semantic_cache_threshold: number;
};

export const runtimeConfig: RuntimeConfig = {
  prompt_version: process.env.PROMPT_VERSION ?? "prompt_v1",
  rules_version: process.env.RULES_VERSION ?? "rules_v1",
  model_capability: process.env.MODEL_CAPABILITY ?? "fast_model",
  semantic_cache_threshold: Number(
    process.env.SEMANTIC_CACHE_THRESHOLD ?? "0.90",
  ),
};
