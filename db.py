import uuid

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from config import DATABASE_URL, OPENAI_EMBEDDING_DIMENSIONS
from log_helpers import log_block

TABLE_NAME = "ai_response_cache"


def to_pgvector(embedding: list[float]) -> str:
    return "[" + ",".join(str(value) for value in embedding) + "]"


def init_db() -> None:
    dimensions = int(OPENAI_EMBEDDING_DIMENSIONS)

    with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                id UUID PRIMARY KEY,
                prompt_version TEXT NOT NULL,
                rules_version TEXT NOT NULL,
                model_capability TEXT NOT NULL,
                input_text TEXT NOT NULL,
                normalized_text TEXT NOT NULL,
                response_json JSONB NOT NULL,
                embedding VECTOR({dimensions}),
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
            """
        )
        cur.execute(
            f"""
            CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_fingerprint
            ON {TABLE_NAME} (
                prompt_version,
                rules_version,
                model_capability,
                normalized_text
            )
            """
        )
        conn.commit()

    log_block(
        "🗄️  Banco inicializado",
        {
            "pgvector": "enabled",
            "table": TABLE_NAME,
            "dimensions": dimensions,
        },
    )


def get_db_status() -> dict:
    status = {
        "connected": False,
        "pgvector_enabled": False,
        "embedding_dimensions": OPENAI_EMBEDDING_DIMENSIONS,
        "table": None,
    }
    try:
        with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
            status["connected"] = True
            cur.execute("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')")
            status["pgvector_enabled"] = bool(cur.fetchone()[0])
            cur.execute("SELECT to_regclass(%s)", (TABLE_NAME,))
            if cur.fetchone()[0] is not None:
                status["table"] = TABLE_NAME
    except Exception as error:
        status["error"] = str(error)
    return status


def insert_semantic_cache_item(
    prompt_version: str,
    rules_version: str,
    model_capability: str,
    input_text: str,
    normalized_text: str,
    response_json: dict,
    embedding: list[float],
) -> str:
    item_id = str(uuid.uuid4())
    with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {TABLE_NAME} (
                id, prompt_version, rules_version, model_capability,
                input_text, normalized_text, response_json, embedding
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s::vector)
            """,
            (
                item_id,
                prompt_version,
                rules_version,
                model_capability,
                input_text,
                normalized_text,
                Jsonb(response_json),
                to_pgvector(embedding),
            ),
        )
        conn.commit()
    return item_id


def search_similar_semantic_cache_items(
    prompt_version: str,
    rules_version: str,
    model_capability: str,
    embedding: list[float],
    limit: int,
) -> list[dict]:
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            WITH query_embedding AS (
                SELECT %s::vector AS value
            )
            SELECT
                c.id,
                c.input_text,
                c.normalized_text,
                c.response_json,
                c.created_at,
                c.embedding <=> q.value AS distance,
                1 - (c.embedding <=> q.value) AS similarity
            FROM {TABLE_NAME} c
            CROSS JOIN query_embedding q
            WHERE c.prompt_version = %s
              AND c.rules_version = %s
              AND c.model_capability = %s
            ORDER BY c.embedding <=> q.value
            LIMIT %s
            """,
            (
                to_pgvector(embedding),
                prompt_version,
                rules_version,
                model_capability,
                limit,
            ),
        )
        return cur.fetchall()
