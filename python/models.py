from typing import Any, Literal, Optional

from pydantic import BaseModel


class TicketRequest(BaseModel):
    message: str


class TicketAnalysis(BaseModel):
    category: Literal[
        "billing",
        "technical_support",
        "account",
        "cancellation",
        "other",
    ]
    confidence: float
    reason: str


class Fingerprint(BaseModel):
    prompt_version: str
    rules_version: str
    model_capability: str
    normalized_text: str


class CacheInfo(BaseModel):
    hit: bool
    key: str
    fingerprint: Fingerprint


class SemanticCacheInfo(BaseModel):
    attempted: bool
    hit: bool
    decision: str
    reason: str
    threshold: float
    best_match_similarity: Optional[float] = None
    best_match_distance: Optional[float] = None
    best_match_id: Optional[str] = None
    best_match_input_text: Optional[str] = None


class SemanticCacheWriteInfo(BaseModel):
    attempted: bool
    saved: bool
    reason: str
    item_id: Optional[str] = None
    embedding_dimension: Optional[int] = None


class TicketResponse(BaseModel):
    source: str
    ai_call_number: int
    elapsed_ms: int
    cache: CacheInfo
    semantic_cache: SemanticCacheInfo
    semantic_cache_write: SemanticCacheWriteInfo
    result: TicketAnalysis


class ConfigUpdate(BaseModel):
    prompt_version: Optional[str] = None
    rules_version: Optional[str] = None
    model_capability: Optional[str] = None
    semantic_cache_threshold: Optional[float] = None


class ConfigResponse(BaseModel):
    prompt_version: str
    rules_version: str
    model_capability: str
    semantic_cache_threshold: float
    embedding_model: str
    embedding_dimensions: int
    database_configured: bool


class DatabaseStatusResponse(BaseModel):
    connected: bool
    pgvector_enabled: bool
    embedding_dimensions: int
    table: Optional[str] = None
    error: Optional[str] = None


class SemanticCacheCreateRequest(BaseModel):
    input_text: str
    response_json: dict[str, Any]


class SemanticCacheCreateResponse(BaseModel):
    id: str
    prompt_version: str
    rules_version: str
    model_capability: str
    input_text: str
    normalized_text: str
    embedding_model: str
    embedding_dimension: int
    embedding_preview: list[float]
    response_json: dict[str, Any]
    created: bool


class EmbeddingsRequest(BaseModel):
    texts: list[str]


class EmbeddingItem(BaseModel):
    text: str
    normalized_text: str
    embedding_dimension: int
    embedding_preview: list[float]


class EmbeddingsResponse(BaseModel):
    model: str
    items: list[EmbeddingItem]


class SemanticCacheSearchRequest(BaseModel):
    input_text: str
    limit: int = 5


class SemanticCacheSearchQuery(BaseModel):
    input_text: str
    normalized_text: str
    embedding_model: str
    embedding_dimension: int


class SemanticCacheSearchFilters(BaseModel):
    prompt_version: str
    rules_version: str
    model_capability: str


class SemanticCacheSearchItem(BaseModel):
    id: str
    input_text: str
    normalized_text: str
    distance: float
    similarity: float
    response_json: dict[str, Any]
    created_at: str


class SemanticCacheSearchResponse(BaseModel):
    query: SemanticCacheSearchQuery
    filters: SemanticCacheSearchFilters
    count: int
    items: list[SemanticCacheSearchItem]


class SemanticCacheEvaluateRequest(BaseModel):
    input_text: str
    threshold: float = 0.9
    limit: int = 5


class SemanticCacheEvaluation(BaseModel):
    threshold: float
    decision: Literal["accepted", "rejected"]
    reason: str
    best_match_similarity: Optional[float] = None
    best_match_distance: Optional[float] = None


class SemanticCacheEvaluateResponse(BaseModel):
    query: SemanticCacheSearchQuery
    filters: SemanticCacheSearchFilters
    evaluation: SemanticCacheEvaluation
    best_match: Optional[SemanticCacheSearchItem] = None
    candidates: list[SemanticCacheSearchItem]
