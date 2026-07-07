# Analisador de Tickets — Embeddings de textos

Analisador de tickets de suporte usando IA com LangChain e FastAPI.

Esta versão adiciona **geração de embeddings** e reorganiza o código em poucos
arquivos, porque o `main.py` começou a crescer.

## Organização do código

- `main.py` — app FastAPI, endpoints e fluxo das requisições (chat e embeddings).
- `models.py` — modelos Pydantic (request/response de tickets, config e embeddings).
- `config.py` — carrega o `.env`, expõe as configs e cria os modelos LangChain.
- `log_helpers.py` — helper de log em bloco, para não poluir o `main.py`.

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Preencha `OPENAI_API_KEY` no `.env`. Modelos configuráveis via `OPENAI_MODEL` e
`OPENAI_EMBEDDING_MODEL`. A API sobe em `http://localhost:8000`.

## Endpoints

```http
POST /tickets/analyze      # classifica um ticket (com cache + fingerprint)
GET  /config               # config runtime + embedding_model
PUT  /config               # altera prompt/rules/model_capability em runtime
POST /embeddings/generate  # gera embeddings de uma lista de textos
```

Entrada do `/embeddings/generate`:

```json
{
  "texts": [
    "Como cancelo minha assinatura?",
    "Quero cancelar meu plano",
    "Não consigo acessar minha conta"
  ]
}
```

Saída (um item por texto):

```json
{
  "model": "text-embedding-3-small",
  "items": [
    {
      "text": "Como cancelo minha assinatura?",
      "normalized_text": "como cancelo minha assinatura?",
      "embedding_dimension": 1536,
      "embedding_preview": [0.0123, -0.0456, 0.0789, 0.0012, -0.0345]
    }
  ]
}
```

## Sobre embeddings

- **Embedding não é resposta de chat.** O retorno é um **vetor numérico** que
  representa o significado do texto.
- A dimensão vem de `len(embedding)` (não é hardcoded) — no `text-embedding-3-small`
  são 1536 números.
- A API mostra apenas um **preview** (5 primeiros números); o vetor completo não é
  retornado nem salvo.
- **Ainda não há similaridade nem pgvector.** Esta etapa só gera e observa o vetor. A
  comparação por similaridade e o cache semântico vêm nas próximas práticas — o
  embedding gerado aqui é a matéria-prima para armazenar no pgvector depois.

## Como testar

Use o `test.http`: as duas primeiras chamadas mostram o cache (miss → hit), o
`GET /config` mostra o `embedding_model`, e o `/embeddings/generate` retorna os
vetores (dimensão + preview).
