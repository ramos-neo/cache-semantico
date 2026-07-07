import re
import json
import time
import hashlib

from fastapi import FastAPI, HTTPException
from langchain_core.prompts import ChatPromptTemplate

from config import (
    OPENAI_EMBEDDING_MODEL,
    runtime_config,
    create_chat_model,
    create_embedding_model,
)
from log_helpers import log_block
from models import (
    TicketRequest,
    TicketAnalysis,
    TicketResponse,
    CacheInfo,
    Fingerprint,
    ConfigUpdate,
    ConfigResponse,
    EmbeddingsRequest,
    EmbeddingItem,
    EmbeddingsResponse,
)


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

chain = prompt | create_chat_model().with_structured_output(TicketAnalysis)
embeddings_model = create_embedding_model()

ai_call_count = 0
CACHE: dict[str, dict] = {}

app = FastAPI()


@app.get("/config", response_model=ConfigResponse)
def get_config() -> ConfigResponse:
    return ConfigResponse(**runtime_config, embedding_model=OPENAI_EMBEDDING_MODEL)


@app.put("/config", response_model=ConfigResponse)
def update_config(update: ConfigUpdate) -> ConfigResponse:
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
    return ConfigResponse(**runtime_config, embedding_model=OPENAI_EMBEDDING_MODEL)


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


@app.post("/embeddings/generate", response_model=EmbeddingsResponse)
def generate_embeddings(request: EmbeddingsRequest) -> EmbeddingsResponse:
    if not request.texts:
        raise HTTPException(status_code=400, detail="A lista de textos não pode estar vazia.")

    normalized_texts = [normalize_text(t) for t in request.texts]
    if any(not n for n in normalized_texts):
        raise HTTPException(
            status_code=400, detail="Cada texto precisa ter conteúdo após a normalização."
        )

    start = time.perf_counter()
    vectors = embeddings_model.embed_documents(normalized_texts)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    items = [
        EmbeddingItem(
            text=text,
            normalized_text=normalized,
            embedding_dimension=len(vector),
            embedding_preview=vector[:5],
        )
        for text, normalized, vector in zip(request.texts, normalized_texts, vectors)
    ]

    log_block(
        "🔢 Embeddings gerados",
        {
            "model": OPENAI_EMBEDDING_MODEL,
            "texts_count": len(items),
            "dimension": items[0].embedding_dimension if items else 0,
            "elapsed_ms": f"{elapsed_ms}ms",
        },
    )
    return EmbeddingsResponse(model=OPENAI_EMBEDDING_MODEL, items=items)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
