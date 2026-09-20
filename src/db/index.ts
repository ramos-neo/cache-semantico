import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  DATABASE_URL,
  GEMINI_EMBEDDING_DIMENSIONS,
} from "../config.js";
import { logBlock } from "../log.js";

const { Pool } = pg;

export const TABLE_NAME = "ai_response_cache";

const pool = new Pool({ connectionString: DATABASE_URL });

function toPgvector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function initDb(): Promise<void> {
  const dimensions = GEMINI_EMBEDDING_DIMENSIONS;
  const client = await pool.connect();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id UUID PRIMARY KEY,
        prompt_version TEXT NOT NULL,
        rules_version TEXT NOT NULL,
        model_capability TEXT NOT NULL,
        input_text TEXT NOT NULL,
        normalized_text TEXT NOT NULL,
        response_json JSONB NOT NULL,
        embedding VECTOR(${dimensions}),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_fingerprint
      ON ${TABLE_NAME} (
        prompt_version,
        rules_version,
        model_capability,
        normalized_text
      )
    `);
  } finally {
    client.release();
  }

  logBlock("🗄️  Banco inicializado", {
    pgvector: "enabled",
    table: TABLE_NAME,
    dimensions,
  });
}

export type DbStatus = {
  connected: boolean;
  pgvector_enabled: boolean;
  embedding_dimensions: number;
  table: string | null;
  error?: string;
};

export async function getDbStatus(): Promise<DbStatus> {
  const status: DbStatus = {
    connected: false,
    pgvector_enabled: false,
    embedding_dimensions: GEMINI_EMBEDDING_DIMENSIONS,
    table: null,
  };

  try {
    const client = await pool.connect();
    try {
      status.connected = true;
      const ext = await client.query<{ exists: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS exists",
      );
      status.pgvector_enabled = Boolean(ext.rows[0]?.exists);

      const table = await client.query<{ to_regclass: string | null }>(
        "SELECT to_regclass($1) AS to_regclass",
        [TABLE_NAME],
      );
      if (table.rows[0]?.to_regclass != null) {
        status.table = TABLE_NAME;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
  }

  return status;
}

export type InsertSemanticCacheItemInput = {
  prompt_version: string;
  rules_version: string;
  model_capability: string;
  input_text: string;
  normalized_text: string;
  response_json: Record<string, unknown>;
  embedding: number[];
};

export async function insertSemanticCacheItem(
  input: InsertSemanticCacheItemInput,
): Promise<string> {
  const itemId = randomUUID();
  await pool.query(
    `
    INSERT INTO ${TABLE_NAME} (
      id, prompt_version, rules_version, model_capability,
      input_text, normalized_text, response_json, embedding
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::vector)
    `,
    [
      itemId,
      input.prompt_version,
      input.rules_version,
      input.model_capability,
      input.input_text,
      input.normalized_text,
      JSON.stringify(input.response_json),
      toPgvector(input.embedding),
    ],
  );
  return itemId;
}

export type SemanticCacheRow = {
  id: string;
  input_text: string;
  normalized_text: string;
  response_json: Record<string, unknown>;
  created_at: Date;
  distance: number;
  similarity: number;
};

export async function searchSimilarSemanticCacheItems(params: {
  prompt_version: string;
  rules_version: string;
  model_capability: string;
  embedding: number[];
  limit: number;
}): Promise<SemanticCacheRow[]> {
  const result = await pool.query<SemanticCacheRow>(
    `
    WITH query_embedding AS (
      SELECT $1::vector AS value
    )
    SELECT
      c.id,
      c.input_text,
      c.normalized_text,
      c.response_json,
      c.created_at,
      c.embedding <=> q.value AS distance,
      1 - (c.embedding <=> q.value) AS similarity
    FROM ${TABLE_NAME} c
    CROSS JOIN query_embedding q
    WHERE c.prompt_version = $2
      AND c.rules_version = $3
      AND c.model_capability = $4
    ORDER BY c.embedding <=> q.value
    LIMIT $5
    `,
    [
      toPgvector(params.embedding),
      params.prompt_version,
      params.rules_version,
      params.model_capability,
      params.limit,
    ],
  );
  return result.rows;
}
