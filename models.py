from typing import Literal, Optional

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


class TicketResponse(BaseModel):
    source: str
    ai_call_number: int
    elapsed_ms: int
    cache: CacheInfo
    result: TicketAnalysis


class ConfigUpdate(BaseModel):
    prompt_version: Optional[str] = None
    rules_version: Optional[str] = None
    model_capability: Optional[str] = None


class ConfigResponse(BaseModel):
    prompt_version: str
    rules_version: str
    model_capability: str
    embedding_model: str


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
