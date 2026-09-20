import { insertSemanticCacheItem } from "../db/index.js";
import type { Fingerprint } from "../fingerprint.js";
import { logBlock } from "../log.js";
import {
  type SemanticCacheSearchItem,
  type SemanticCacheWriteInfo,
  type TicketAnalysis,
} from "../schemas/ticket.js";

export type EvaluationResult = {
  decision: "accepted" | "rejected";
  reason: string;
  best_match: SemanticCacheSearchItem | null;
};

export function evaluateBestMatch(
  items: SemanticCacheSearchItem[],
  threshold: number,
): EvaluationResult {
  if (items.length === 0) {
    return {
      decision: "rejected",
      reason: "No candidates found for current fingerprint.",
      best_match: null,
    };
  }

  const bestMatch = items[0];
  if (bestMatch.similarity >= threshold) {
    return {
      decision: "accepted",
      reason: "Best match similarity is greater than or equal to threshold.",
      best_match: bestMatch,
    };
  }

  return {
    decision: "rejected",
    reason: "Best match similarity is below threshold.",
    best_match: bestMatch,
  };
}

export async function saveAiResultToSemanticCache(
  fingerprint: Fingerprint,
  inputText: string,
  result: TicketAnalysis,
  embedding: number[],
): Promise<SemanticCacheWriteInfo> {
  const dimension = embedding.length;
  try {
    const itemId = await insertSemanticCacheItem({
      ...fingerprint,
      input_text: inputText,
      response_json: result,
      embedding,
    });
    return {
      attempted: true,
      saved: true,
      reason: "AI response saved to semantic cache after semantic miss.",
      item_id: itemId,
      embedding_dimension: dimension,
    };
  } catch (error) {
    logBlock("❌ Falha ao gravar no cache semântico", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      attempted: true,
      saved: false,
      reason: "AI response returned, but semantic cache write failed.",
      item_id: null,
      embedding_dimension: dimension,
    };
  }
}
