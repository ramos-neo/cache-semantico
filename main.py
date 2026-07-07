import re
import json
import time
import hashlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from langchain_core.prompts import ChatPromptTemplate

from config import (
    OPENAI_EMBEDDING_MODEL,
    OPENAI_EMBEDDING_DIMENSIONS,
    DATABASE_URL,
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
    DatabaseStatusResponse,
    SemanticCacheCreateRequest,
    SemanticCacheCreateResponse,
    SemanticCacheSearchRequest,
    SemanticCacheSearchResponse,
    SemanticCacheSearchQuery,
    SemanticCacheSearchFilters,
    SemanticCacheSearchItem,
    SemanticCacheEvaluateRequest,
    SemanticCacheEvaluateResponse,
    SemanticCacheEvaluation,
)
from db import (
    init_db,
    get_db_status,
    insert_semantic_cache_item,
    search_similar_semantic_cache_items,
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as error:
        log_block(
            "❌ Falha ao inicializar o banco",
            {
                "erro": error,
                "dica": "O Postgres está no ar? Rode: docker compose up -d",
            },
        )
    yield


app = FastAPI(lifespan=lifespan)


def config_response() -> ConfigResponse:
    return ConfigResponse(
        **runtime_config,
        embedding_model=OPENAI_EMBEDDING_MODEL,
        embedding_dimensions=OPENAI_EMBEDDING_DIMENSIONS,
        database_configured=bool(DATABASE_URL),
    )


@app.get("/config", response_model=ConfigResponse)
def get_config() -> ConfigResponse:
    return config_response()


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
    return config_response()


@app.get("/db/status", response_model=DatabaseStatusResponse)
def db_status() -> DatabaseStatusResponse:
    return DatabaseStatusResponse(**get_db_status())


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


@app.post("/semantic-cache/items", response_model=SemanticCacheCreateResponse)
def create_semantic_cache_item(
    request: SemanticCacheCreateRequest,
) -> SemanticCacheCreateResponse:
    fingerprint = build_fingerprint(request.input_text)
    if not fingerprint["normalized_text"]:
        raise HTTPException(
            status_code=400, detail="input_text precisa ter conteúdo após a normalização."
        )

    embedding = embeddings_model.embed_query(fingerprint["normalized_text"])
    dimension = len(embedding)

    item_id = insert_semantic_cache_item(
        **fingerprint,
        input_text=request.input_text,
        response_json=request.response_json,
        embedding=embedding,
    )

    log_block(
        "💾 Item de cache semântico criado",
        {
            "id": item_id,
            "input_text": request.input_text,
            "normalized_text": fingerprint["normalized_text"],
            "embedding_dimension": dimension,
            "created": True,
        },
    )
    return SemanticCacheCreateResponse(
        **fingerprint,
        id=item_id,
        input_text=request.input_text,
        embedding_model=OPENAI_EMBEDDING_MODEL,
        embedding_dimension=dimension,
        embedding_preview=embedding[:5],
        response_json=request.response_json,
        created=True,
    )


def run_semantic_search(input_text: str, limit: int):
    if limit < 1:
        raise HTTPException(status_code=400, detail="limit precisa ser no mínimo 1.")
    limit = min(limit, 10)

    fingerprint = build_fingerprint(input_text)
    if not fingerprint["normalized_text"]:
        raise HTTPException(
            status_code=400, detail="input_text precisa ter conteúdo após a normalização."
        )

    embedding = embeddings_model.embed_query(fingerprint["normalized_text"])

    rows = search_similar_semantic_cache_items(
        prompt_version=fingerprint["prompt_version"],
        rules_version=fingerprint["rules_version"],
        model_capability=fingerprint["model_capability"],
        embedding=embedding,
        limit=limit,
    )

    items = [
        SemanticCacheSearchItem(
            id=str(row["id"]),
            input_text=row["input_text"],
            normalized_text=row["normalized_text"],
            distance=row["distance"],
            similarity=row["similarity"],
            response_json=row["response_json"],
            created_at=row["created_at"].isoformat(),
        )
        for row in rows
    ]

    query = SemanticCacheSearchQuery(
        input_text=input_text,
        normalized_text=fingerprint["normalized_text"],
        embedding_model=OPENAI_EMBEDDING_MODEL,
        embedding_dimension=len(embedding),
    )
    filters = SemanticCacheSearchFilters(
        prompt_version=fingerprint["prompt_version"],
        rules_version=fingerprint["rules_version"],
        model_capability=fingerprint["model_capability"],
    )
    return query, filters, items


def evaluate_best_match(items: list, threshold: float) -> dict:
    if not items:
        return {
            "decision": "rejected",
            "reason": "No candidates found for current fingerprint.",
            "best_match": None,
        }

    best_match = items[0]
    if best_match.similarity >= threshold:
        reason = "Best match similarity is greater than or equal to threshold."
        decision = "accepted"
    else:
        reason = "Best match similarity is below threshold."
        decision = "rejected"
    return {"decision": decision, "reason": reason, "best_match": best_match}


@app.post("/semantic-cache/search", response_model=SemanticCacheSearchResponse)
def search_semantic_cache(
    request: SemanticCacheSearchRequest,
) -> SemanticCacheSearchResponse:
    query, filters, items = run_semantic_search(request.input_text, request.limit)

    log_block(
        "🔎 Busca semântica",
        {
            "input_text": request.input_text,
            "normalized_text": query.normalized_text,
            "limit": min(request.limit, 10),
            "results": len(items),
            "best_similarity": round(items[0].similarity, 4) if items else "-",
        },
    )
    return SemanticCacheSearchResponse(
        query=query, filters=filters, count=len(items), items=items
    )


@app.post("/semantic-cache/evaluate", response_model=SemanticCacheEvaluateResponse)
def evaluate_semantic_cache(
    request: SemanticCacheEvaluateRequest,
) -> SemanticCacheEvaluateResponse:
    if not 0 < request.threshold <= 1:
        raise HTTPException(
            status_code=400, detail="threshold precisa estar entre 0 (exclusivo) e 1."
        )

    query, filters, items = run_semantic_search(request.input_text, request.limit)
    result = evaluate_best_match(items, request.threshold)
    best_match = result["best_match"]

    log_block(
        "⚖️  Avaliação de cache semântico",
        {
            "input_text": request.input_text,
            "normalized_text": query.normalized_text,
            "threshold": request.threshold,
            "results": len(items),
            "decision": result["decision"],
            "best_similarity": round(best_match.similarity, 4) if best_match else "-",
        },
    )
    return SemanticCacheEvaluateResponse(
        query=query,
        filters=filters,
        evaluation=SemanticCacheEvaluation(
            threshold=request.threshold,
            decision=result["decision"],
            reason=result["reason"],
            best_match_similarity=best_match.similarity if best_match else None,
            best_match_distance=best_match.distance if best_match else None,
        ),
        best_match=best_match,
        candidates=items,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
