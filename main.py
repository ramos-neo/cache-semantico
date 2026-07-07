import os
import re
import time
import hashlib
import logging
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("tickets")

MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


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


class CacheInfo(BaseModel):
    hit: bool
    key: str
    normalized_text: str


class TicketResponse(BaseModel):
    source: str
    ai_call_number: int
    elapsed_ms: int
    cache: CacheInfo
    result: TicketAnalysis


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def build_cache_key(normalized_text: str) -> str:
    return hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()


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


@app.post("/tickets/analyze", response_model=TicketResponse)
def analyze_ticket(request: TicketRequest) -> TicketResponse:
    global ai_call_count

    normalized_text = normalize_text(request.message)
    key = build_cache_key(normalized_text)

    start = time.perf_counter()

    if key in CACHE:
        cached = TicketAnalysis(**CACHE[key])
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        log_block(
            "✅ CACHE HIT — resposta do cache (IA não chamada)",
            {
                "Ticket": request.message,
                "Normalizado": normalized_text,
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
            cache=CacheInfo(hit=True, key=key, normalized_text=normalized_text),
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
            "Normalizado": normalized_text,
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
        cache=CacheInfo(hit=False, key=key, normalized_text=normalized_text),
        result=result,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
