/** Resposta de `GET /health`. */
export interface HealthResponse {
  ok: boolean;
}

/** Resposta de `GET /db/status`. */
export interface DbStatusResponse {
  connected: boolean;
  pgvector_enabled: boolean;
  embedding_dimensions: number;
  table: string | null;
  error?: string;
}

export type HealthState = 'checking' | 'healthy' | 'unhealthy';
