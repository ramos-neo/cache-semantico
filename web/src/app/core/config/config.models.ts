/** Resposta de `GET`/`PUT /config`. */
export interface RuntimeConfig {
  prompt_version: string;
  rules_version: string;
  model_capability: string;
  semantic_cache_threshold: number;
  embedding_model: string;
  embedding_dimensions: number;
  database_configured: boolean;
}

export interface ConfigUpdateRequest {
  prompt_version?: string;
  rules_version?: string;
  model_capability?: string;
  semantic_cache_threshold?: number;
}
