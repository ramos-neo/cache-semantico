import { z } from "zod";

export const ticketCategories = [
  "billing",
  "technical_support",
  "account",
  "cancellation",
  "other",
] as const;

export const ticketAnalysisSchema = z.object({
  category: z.enum(ticketCategories),
  confidence: z.number(),
  reason: z.string(),
});

export type TicketAnalysis = z.infer<typeof ticketAnalysisSchema>;

/** JSON Schema estrito para Gemini Structured Outputs (`responseJsonSchema`). */
export const ticketAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["category", "confidence", "reason"],
  properties: {
    category: {
      type: "string",
      enum: [...ticketCategories],
    },
    confidence: {
      type: "number",
    },
    reason: {
      type: "string",
    },
  },
} as const;

export const ticketRequestSchema = z.object({
  message: z.string(),
});

export const fingerprintSchema = z.object({
  prompt_version: z.string(),
  rules_version: z.string(),
  model_capability: z.string(),
  normalized_text: z.string(),
});

export const cacheInfoSchema = z.object({
  hit: z.boolean(),
  key: z.string(),
  fingerprint: fingerprintSchema,
});

export const semanticCacheInfoSchema = z.object({
  attempted: z.boolean(),
  hit: z.boolean(),
  decision: z.string(),
  reason: z.string(),
  threshold: z.number(),
  best_match_similarity: z.number().nullable().optional(),
  best_match_distance: z.number().nullable().optional(),
  best_match_id: z.string().nullable().optional(),
  best_match_input_text: z.string().nullable().optional(),
});

export const semanticCacheWriteInfoSchema = z.object({
  attempted: z.boolean(),
  saved: z.boolean(),
  reason: z.string(),
  item_id: z.string().nullable().optional(),
  embedding_dimension: z.number().nullable().optional(),
});

export type SemanticCacheWriteInfo = z.infer<
  typeof semanticCacheWriteInfoSchema
>;

export const ticketResponseSchema = z.object({
  source: z.string(),
  ai_call_number: z.number(),
  elapsed_ms: z.number(),
  cache: cacheInfoSchema,
  semantic_cache: semanticCacheInfoSchema,
  semantic_cache_write: semanticCacheWriteInfoSchema,
  result: ticketAnalysisSchema,
});

export type TicketResponse = z.infer<typeof ticketResponseSchema>;

export const configUpdateSchema = z.object({
  prompt_version: z.string().optional(),
  rules_version: z.string().optional(),
  model_capability: z.string().optional(),
  semantic_cache_threshold: z.number().optional(),
});

export const embeddingsRequestSchema = z.object({
  texts: z.array(z.string()),
});

export const semanticCacheCreateRequestSchema = z.object({
  input_text: z.string(),
  response_json: z.record(z.unknown()),
});

export const semanticCacheSearchRequestSchema = z.object({
  input_text: z.string(),
  limit: z.number().int().default(5),
});

export const semanticCacheEvaluateRequestSchema = z.object({
  input_text: z.string(),
  threshold: z.number().default(0.9),
  limit: z.number().int().default(5),
});

export type SemanticCacheSearchItem = {
  id: string;
  input_text: string;
  normalized_text: string;
  distance: number;
  similarity: number;
  response_json: Record<string, unknown>;
  created_at: string;
};
