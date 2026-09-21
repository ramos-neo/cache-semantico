import { AnalyzeSource } from '../tickets/tickets.models';

/** Entrada persistida no histórico client-side de análises. */
export interface AnalysisHistoryEntry {
  id: string;
  /** ISO-8601 */
  timestamp: string;
  message: string;
  source: AnalyzeSource;
  elapsed_ms: number;
  ai_call_number: number;
  /** Categoria do resultado, quando disponível. */
  category?: string;
  confidence?: number;
  reason?: string;
}

/** Contagens agregadas por origem da cascata. */
export interface SourceCounts {
  exact_cache: number;
  semantic_cache: number;
  ai_model: number;
  other: number;
  total: number;
}

export const ANALYSIS_HISTORY_STORAGE_KEY = 'cache-semantico.analysis-history';
export const ANALYSIS_HISTORY_MAX_ENTRIES = 100;
