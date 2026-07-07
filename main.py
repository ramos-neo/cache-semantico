import os
import time
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


class TicketResponse(BaseModel):
    source: str
    ai_call_number: int
    elapsed_ms: int
    result: TicketAnalysis


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

app = FastAPI()


@app.post("/tickets/analyze", response_model=TicketResponse)
def analyze_ticket(request: TicketRequest) -> TicketResponse:
    global ai_call_count

    logger.info(f"Received ticket: {request.message}")
    logger.info("Calling AI model")

    start = time.perf_counter()
    result = chain.invoke({"message": request.message})
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    ai_call_count += 1

    logger.info(f"AI call number: {ai_call_count}")
    logger.info(f"Elapsed: {elapsed_ms}ms")
    logger.info(f"Category: {result.category}")

    return TicketResponse(
        source="ai_model",
        ai_call_number=ai_call_count,
        elapsed_ms=elapsed_ms,
        result=result,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
