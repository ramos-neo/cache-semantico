import os

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_openai import OpenAIEmbeddings

load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
MODEL_TEMPERATURE = float(os.getenv("MODEL_TEMPERATURE", "0"))
PROMPT_VERSION = os.getenv("PROMPT_VERSION", "prompt_v1")
RULES_VERSION = os.getenv("RULES_VERSION", "rules_v1")
MODEL_CAPABILITY = os.getenv("MODEL_CAPABILITY", "fast_model")

runtime_config = {
    "prompt_version": PROMPT_VERSION,
    "rules_version": RULES_VERSION,
    "model_capability": MODEL_CAPABILITY,
}


def create_chat_model():
    return init_chat_model(
        OPENAI_MODEL, model_provider="openai", temperature=MODEL_TEMPERATURE
    )


def create_embedding_model():
    return OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL)
