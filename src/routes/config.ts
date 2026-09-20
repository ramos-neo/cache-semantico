import { Hono } from "hono";
import {
  DATABASE_URL,
  OPENAI_EMBEDDING_DIMENSIONS,
  OPENAI_EMBEDDING_MODEL,
  runtimeConfig,
} from "../config.js";
import { logBlock } from "../log.js";
import { configUpdateSchema } from "../schemas/ticket.js";

export const configRoutes = new Hono();

function configResponse() {
  return {
    ...runtimeConfig,
    embedding_model: OPENAI_EMBEDDING_MODEL,
    embedding_dimensions: OPENAI_EMBEDDING_DIMENSIONS,
    database_configured: Boolean(DATABASE_URL),
  };
}

configRoutes.get("/config", (c) => c.json(configResponse()));

configRoutes.put("/config", async (c) => {
  const body = configUpdateSchema.parse(await c.req.json());

  if (
    body.semantic_cache_threshold !== undefined &&
    !(body.semantic_cache_threshold > 0 && body.semantic_cache_threshold <= 1)
  ) {
    return c.json(
      {
        detail:
          "semantic_cache_threshold precisa estar entre 0 (exclusivo) e 1.",
      },
      400,
    );
  }

  if (body.prompt_version !== undefined) {
    runtimeConfig.prompt_version = body.prompt_version;
  }
  if (body.rules_version !== undefined) {
    runtimeConfig.rules_version = body.rules_version;
  }
  if (body.model_capability !== undefined) {
    runtimeConfig.model_capability = body.model_capability;
  }
  if (body.semantic_cache_threshold !== undefined) {
    runtimeConfig.semantic_cache_threshold = body.semantic_cache_threshold;
  }

  logBlock("⚙️  Runtime config atualizado", {
    "Prompt version": runtimeConfig.prompt_version,
    "Rules version": runtimeConfig.rules_version,
    "Model capability": runtimeConfig.model_capability,
    "Semantic threshold": runtimeConfig.semantic_cache_threshold,
  });

  return c.json(configResponse());
});
