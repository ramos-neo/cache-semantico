import { Hono } from "hono";
import { embedQuery } from "../ai/embeddings.js";
import { evaluateBestMatch } from "../cache/semantic.js";
import { OPENAI_EMBEDDING_MODEL } from "../config.js";
import {
  insertSemanticCacheItem,
  searchSimilarSemanticCacheItems,
} from "../db/index.js";
import { buildFingerprint } from "../fingerprint.js";
import { logBlock } from "../log.js";
import {
  semanticCacheCreateRequestSchema,
  semanticCacheEvaluateRequestSchema,
  semanticCacheSearchRequestSchema,
  type SemanticCacheSearchItem,
} from "../schemas/ticket.js";

export const semanticCacheRoutes = new Hono();

function rowsToItems(
  rows: Awaited<ReturnType<typeof searchSimilarSemanticCacheItems>>,
): SemanticCacheSearchItem[] {
  return rows.map((row) => ({
    id: String(row.id),
    input_text: row.input_text,
    normalized_text: row.normalized_text,
    distance: Number(row.distance),
    similarity: Number(row.similarity),
    response_json: row.response_json,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}

export async function searchCandidates(
  fingerprint: ReturnType<typeof buildFingerprint>,
  limit: number,
): Promise<{ embedding: number[]; items: SemanticCacheSearchItem[] }> {
  const embedding = await embedQuery(fingerprint.normalized_text);
  const rows = await searchSimilarSemanticCacheItems({
    prompt_version: fingerprint.prompt_version,
    rules_version: fingerprint.rules_version,
    model_capability: fingerprint.model_capability,
    embedding,
    limit,
  });
  return { embedding, items: rowsToItems(rows) };
}

export async function runSemanticSearch(inputText: string, limit: number) {
  if (limit < 1) {
    throw new Error("limit precisa ser no mínimo 1.");
  }
  const cappedLimit = Math.min(limit, 10);

  const fingerprint = buildFingerprint(inputText);
  if (!fingerprint.normalized_text) {
    throw new Error("input_text precisa ter conteúdo após a normalização.");
  }

  const { embedding, items } = await searchCandidates(fingerprint, cappedLimit);

  const query = {
    input_text: inputText,
    normalized_text: fingerprint.normalized_text,
    embedding_model: OPENAI_EMBEDDING_MODEL,
    embedding_dimension: embedding.length,
  };
  const filters = {
    prompt_version: fingerprint.prompt_version,
    rules_version: fingerprint.rules_version,
    model_capability: fingerprint.model_capability,
  };

  return { query, filters, items, embedding, fingerprint };
}

semanticCacheRoutes.post("/semantic-cache/items", async (c) => {
  const body = semanticCacheCreateRequestSchema.parse(await c.req.json());
  const fingerprint = buildFingerprint(body.input_text);

  if (!fingerprint.normalized_text) {
    return c.json(
      { detail: "input_text precisa ter conteúdo após a normalização." },
      400,
    );
  }

  const embedding = await embedQuery(fingerprint.normalized_text);
  const dimension = embedding.length;

  const itemId = await insertSemanticCacheItem({
    ...fingerprint,
    input_text: body.input_text,
    response_json: body.response_json,
    embedding,
  });

  logBlock("💾 Item de cache semântico criado", {
    id: itemId,
    input_text: body.input_text,
    normalized_text: fingerprint.normalized_text,
    embedding_dimension: dimension,
    created: true,
  });

  return c.json({
    ...fingerprint,
    id: itemId,
    input_text: body.input_text,
    embedding_model: OPENAI_EMBEDDING_MODEL,
    embedding_dimension: dimension,
    embedding_preview: embedding.slice(0, 5),
    response_json: body.response_json,
    created: true,
  });
});

semanticCacheRoutes.post("/semantic-cache/search", async (c) => {
  const body = semanticCacheSearchRequestSchema.parse(await c.req.json());

  try {
    const { query, filters, items } = await runSemanticSearch(
      body.input_text,
      body.limit,
    );

    logBlock("🔎 Busca semântica", {
      input_text: body.input_text,
      normalized_text: query.normalized_text,
      limit: Math.min(body.limit, 10),
      results: items.length,
      best_similarity: items[0] ? Number(items[0].similarity.toFixed(4)) : "-",
    });

    return c.json({
      query,
      filters,
      count: items.length,
      items,
    });
  } catch (error) {
    return c.json(
      { detail: error instanceof Error ? error.message : String(error) },
      400,
    );
  }
});

semanticCacheRoutes.post("/semantic-cache/evaluate", async (c) => {
  const body = semanticCacheEvaluateRequestSchema.parse(await c.req.json());

  if (!(body.threshold > 0 && body.threshold <= 1)) {
    return c.json(
      { detail: "threshold precisa estar entre 0 (exclusivo) e 1." },
      400,
    );
  }

  try {
    const { query, filters, items } = await runSemanticSearch(
      body.input_text,
      body.limit,
    );
    const result = evaluateBestMatch(items, body.threshold);
    const bestMatch = result.best_match;

    logBlock("⚖️  Avaliação de cache semântico", {
      input_text: body.input_text,
      normalized_text: query.normalized_text,
      threshold: body.threshold,
      results: items.length,
      decision: result.decision,
      best_similarity: bestMatch
        ? Number(bestMatch.similarity.toFixed(4))
        : "-",
    });

    return c.json({
      query,
      filters,
      evaluation: {
        threshold: body.threshold,
        decision: result.decision,
        reason: result.reason,
        best_match_similarity: bestMatch?.similarity ?? null,
        best_match_distance: bestMatch?.distance ?? null,
      },
      best_match: bestMatch,
      candidates: items,
    });
  } catch (error) {
    return c.json(
      { detail: error instanceof Error ? error.message : String(error) },
      400,
    );
  }
});
