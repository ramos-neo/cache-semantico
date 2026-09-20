import { Hono } from "hono";
import { classifyTicket } from "../ai/classify.js";
import {
  getAiCallCount,
  getExactCache,
  incrementAiCallCount,
  setExactCache,
} from "../cache/exact.js";
import {
  evaluateBestMatch,
  saveAiResultToSemanticCache,
} from "../cache/semantic.js";
import { runtimeConfig } from "../config.js";
import { buildCacheKey, buildFingerprint } from "../fingerprint.js";
import { logBlock } from "../log.js";
import {
  ticketAnalysisSchema,
  ticketRequestSchema,
  type TicketAnalysis,
} from "../schemas/ticket.js";
import { searchCandidates } from "./semantic-cache.js";

export const ticketsRoutes = new Hono();

ticketsRoutes.post("/tickets/analyze", async (c) => {
  const body = ticketRequestSchema.parse(await c.req.json());

  const fingerprint = buildFingerprint(body.message);
  const key = buildCacheKey(fingerprint);
  const threshold = runtimeConfig.semantic_cache_threshold;
  const start = performance.now();

  const exactHit = getExactCache(key);
  if (exactHit) {
    logBlock("✅ EXACT CACHE HIT (IA não chamada)", {
      source: "exact_cache",
      semantic_cache: "skipped",
      semantic_cache_write: "skipped",
      ai_called: false,
    });

    return c.json({
      source: "exact_cache",
      ai_call_number: getAiCallCount(),
      elapsed_ms: Math.trunc(performance.now() - start),
      cache: {
        hit: true,
        key,
        fingerprint,
      },
      semantic_cache: {
        attempted: false,
        hit: false,
        decision: "skipped",
        reason: "Exact cache hit. Semantic cache was not evaluated.",
        threshold,
      },
      semantic_cache_write: {
        attempted: false,
        saved: false,
        reason: "Exact cache hit. No semantic cache write needed.",
      },
      result: exactHit,
    });
  }

  const cacheInfo = {
    hit: false,
    key,
    fingerprint,
  };

  const { embedding, items } = await searchCandidates(fingerprint, 5);
  const evaluation = evaluateBestMatch(items, threshold);
  let best = evaluation.best_match;

  let semanticResult: TicketAnalysis | null = null;
  if (evaluation.decision === "accepted" && best) {
    const parsed = ticketAnalysisSchema.safeParse(best.response_json);
    if (parsed.success) {
      semanticResult = parsed.data;
    } else {
      evaluation.decision = "rejected";
      evaluation.reason =
        "Best match response_json is invalid; treated as semantic miss.";
    }
  }

  const semanticCache = {
    attempted: true,
    hit: semanticResult !== null,
    decision: evaluation.decision,
    reason: evaluation.reason,
    threshold,
    best_match_similarity: best?.similarity ?? null,
    best_match_distance: best?.distance ?? null,
    best_match_id: best?.id ?? null,
    best_match_input_text: best?.input_text ?? null,
  };

  if (semanticResult !== null && best) {
    logBlock("✅ SEMANTIC CACHE HIT (IA não chamada)", {
      source: "semantic_cache",
      semantic_cache_write: "skipped",
      best_similarity: Number(best.similarity.toFixed(4)),
      threshold,
      ai_called: false,
    });

    return c.json({
      source: "semantic_cache",
      ai_call_number: getAiCallCount(),
      elapsed_ms: Math.trunc(performance.now() - start),
      cache: cacheInfo,
      semantic_cache: semanticCache,
      semantic_cache_write: {
        attempted: false,
        saved: false,
        reason: "Semantic cache hit. No new item was created.",
      },
      result: semanticResult,
    });
  }

  const result = await classifyTicket(body.message);
  const aiCalls = incrementAiCallCount();
  setExactCache(key, result);

  const semanticCacheWrite = await saveAiResultToSemanticCache(
    fingerprint,
    body.message,
    result,
    embedding,
  );

  logBlock("❌ CACHE MISS — IA chamada", {
    semantic_cache: evaluation.decision,
    calling_ai: true,
    semantic_cache_write: semanticCacheWrite.saved ? "saved" : "failed",
    item_id: semanticCacheWrite.item_id ?? "-",
    "AI calls": aiCalls,
    Categoria: result.category,
  });

  return c.json({
    source: "ai_model",
    ai_call_number: aiCalls,
    elapsed_ms: Math.trunc(performance.now() - start),
    cache: cacheInfo,
    semantic_cache: semanticCache,
    semantic_cache_write: semanticCacheWrite,
    result,
  });
});
