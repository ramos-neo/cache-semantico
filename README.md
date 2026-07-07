# Analisador de Tickets — Baseline (sem cache)

Analisador de tickets de suporte usando IA com LangChain e FastAPI.

Esta é a versão **baseline** do capítulo "Cache em Aplicações com IA". Aqui ainda
**não existe nenhum tipo de cache**: toda requisição chama o modelo.

O campo `ai_call_number` mostra quantas vezes a IA foi chamada desde que o servidor
subiu. Duas chamadas iguais chamam a IA duas vezes — e o contador aumenta nas duas.

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Preencha `OPENAI_API_KEY` no arquivo `.env`. O modelo padrão é `gpt-4.1-mini`
(configurável via `OPENAI_MODEL`).

A API sobe em `http://localhost:8000`.

## Endpoint

```http
POST /tickets/analyze
```

Entrada:

```json
{
  "message": "Tenho dúvidas sobre cobrança, pode me ajudar?"
}
```

Saída:

```json
{
  "source": "ai_model",
  "ai_call_number": 1,
  "elapsed_ms": 1234,
  "result": {
    "category": "billing",
    "confidence": 0.9,
    "reason": "O usuário mencionou dúvidas sobre cobrança."
  }
}
```

Categorias possíveis: `billing`, `technical_support`, `account`, `cancellation`, `other`.

## Como testar

Use o arquivo `test.http` (VS Code REST Client ou similar). Faça a mesma chamada
duas vezes e observe que `ai_call_number` aumenta nas duas — confirmando que **não
existe cache** e que toda requisição chama o modelo.

## Por que baseline?

Esta versão será evoluída nas próximas práticas com cache exato, fingerprint,
embeddings, pgvector, busca por similaridade, threshold e cache semântico. Compare
sempre com este baseline para entender o ganho de cada técnica de cache.
