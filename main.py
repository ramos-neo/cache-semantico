import os
import re
import json
import time
import hashlib
import logging
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("tickets")

MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

runtime_config = {
    "prompt_version": os.getenv("PROMPT_VERSION", "prompt_v1"),
    "rules_version": os.getenv("RULES_VERSION", "rules_v1"),
    "model_capability": os.getenv("MODEL_CAPABILITY", "fast_model"),
}


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


class TicketRequest(BaseModel):
    message: str


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


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def build_fingerprint(message: str) -> dict:
    return {
        "prompt_version": runtime_config["prompt_version"],
        "rules_version": runtime_config["rules_version"],
        "model_capability": runtime_config["model_capability"],
        "normalized_text": normalize_text(message),
    }


def build_cache_key(fingerprint: dict) -> str:
    raw = json.dumps(fingerprint, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


SEPARATOR = "─" * 64


def log_block(title: str, fields: dict[str, object]) -> None:
    lines = [SEPARATOR, title, SEPARATOR]
    width = max(len(k) for k in fields)
    for label, value in fields.items():
        lines.append(f"  {label:<{width}} : {value}")
    lines.append(SEPARATOR)
    logger.info("\n" + "\n".join(lines) + "\n")


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Você é um classificador de tickets de suporte.\n"
            "Classifique a mensagem em uma das categorias: "
            "billing, technical_support, account, cancellation, other.\n"
            "Retorne uma confiança entre 0 e 1 e um motivo curto.\n"
            "Não invente categorias fora da lista.",
        ),
        ("human", "Mensagem:\n{message}"),
    ]
)

llm = init_chat_model(MODEL_NAME, model_provider="openai", temperature=0)
chain = prompt | llm.with_structured_output(TicketAnalysis)

ai_call_count = 0
CACHE: dict[str, dict] = {}

app = FastAPI()


@app.get("/config")
def get_config() -> dict:
    return runtime_config


@app.put("/config")
def update_config(update: ConfigUpdate) -> dict:
    for field, value in update.model_dump(exclude_none=True).items():
        runtime_config[field] = value

    log_block(
        "⚙️  Runtime config atualizado",
        {
            "Prompt version": runtime_config["prompt_version"],
            "Rules version": runtime_config["rules_version"],
            "Model capability": runtime_config["model_capability"],
        },
    )
    return runtime_config


@app.post("/tickets/analyze", response_model=TicketResponse)
def analyze_ticket(request: TicketRequest) -> TicketResponse:
    global ai_call_count

    fingerprint = build_fingerprint(request.message)
    key = build_cache_key(fingerprint)

    start = time.perf_counter()

    if key in CACHE:
        cached = TicketAnalysis(**CACHE[key])
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        log_block(
            "✅ CACHE HIT — resposta do cache (IA não chamada)",
            {
                "Ticket": request.message,
                "Normalizado": fingerprint["normalized_text"],
                "Prompt version": fingerprint["prompt_version"],
                "Rules version": fingerprint["rules_version"],
                "Model capability": fingerprint["model_capability"],
                "Cache key": key[:16] + "…",
                "AI calls": ai_call_count,
                "Categoria": cached.category,
                "Tempo": f"{elapsed_ms}ms",
            },
        )
        return TicketResponse(
            source="exact_cache",
            ai_call_number=ai_call_count,
            elapsed_ms=elapsed_ms,
            cache=CacheInfo(hit=True, key=key, fingerprint=Fingerprint(**fingerprint)),
            result=cached,
        )

    result = chain.invoke({"message": request.message})
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    ai_call_count += 1
    CACHE[key] = result.model_dump()

    log_block(
        "❌ CACHE MISS — IA chamada",
        {
            "Ticket": request.message,
            "Normalizado": fingerprint["normalized_text"],
            "Prompt version": fingerprint["prompt_version"],
            "Rules version": fingerprint["rules_version"],
            "Model capability": fingerprint["model_capability"],
            "Cache key": key[:16] + "…",
            "AI calls": ai_call_count,
            "Categoria": result.category,
            "Tempo": f"{elapsed_ms}ms",
        },
    )
    return TicketResponse(
        source="ai_model",
        ai_call_number=ai_call_count,
        elapsed_ms=elapsed_ms,
        cache=CacheInfo(hit=False, key=key, fingerprint=Fingerprint(**fingerprint)),
        result=result,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
