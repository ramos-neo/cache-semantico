/** Categorias de ticket retornadas por `POST /tickets/analyze`. */
export const ticketCategories = [
  'billing',
  'technical_support',
  'account',
  'cancellation',
  'other',
] as const;

export type TicketCategory = (typeof ticketCategories)[number];

/** Origem da resposta na cascata de cache. */
export type AnalyzeSource = 'exact_cache' | 'semantic_cache' | 'ai_model' | string;

export interface TicketAnalyzeRequest {
  message: string;
}

export interface TicketAnalysisResult {
  category: TicketCategory;
  confidence: number;
  reason: string;
}

export interface FingerprintInfo {
  prompt_version: string;
  rules_version: string;
  model_capability: string;
  normalized_text: string;
}

export interface ExactCacheInfo {
  hit: boolean;
  key: string;
  fingerprint: FingerprintInfo;
}

export interface SemanticCacheInfo {
  attempted: boolean;
  hit: boolean;
  decision: string;
  reason: string;
  threshold: number;
  best_match_similarity?: number | null;
  best_match_distance?: number | null;
  best_match_id?: string | null;
  best_match_input_text?: string | null;
}

export interface SemanticCacheWriteInfo {
  attempted: boolean;
  saved: boolean;
  reason: string;
  item_id?: string | null;
  embedding_dimension?: number | null;
}

/** Resposta de `POST /tickets/analyze`. */
export interface TicketAnalyzeResponse {
  source: AnalyzeSource;
  ai_call_number: number;
  elapsed_ms: number;
  cache: ExactCacheInfo;
  semantic_cache: SemanticCacheInfo;
  semantic_cache_write: SemanticCacheWriteInfo;
  result: TicketAnalysisResult;
}
