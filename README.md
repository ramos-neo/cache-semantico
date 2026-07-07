# Analisador de Tickets — Cache com fingerprint

Analisador de tickets de suporte usando IA com LangChain e FastAPI.

Esta versão evolui o cache exato: a chave deixa de depender só da mensagem e passa a
ser um **fingerprint** do contexto que gerou a resposta.

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

## Endpoints

```http
POST /tickets/analyze   # classifica um ticket (com cache)
GET  /config            # mostra a configuração runtime atual
PUT  /config            # altera prompt_version / rules_version / model_capability
```

Entrada do `/tickets/analyze`:

```json
{
  "message": "Tenho dúvidas sobre cobrança, pode me ajudar?"
}
```

Saída (cache miss — IA chamada):

```json
{
  "source": "ai_model",
  "ai_call_number": 1,
  "elapsed_ms": 1234,
  "cache": {
    "hit": false,
    "key": "...",
    "fingerprint": {
      "prompt_version": "prompt_v1",
      "rules_version": "rules_v1",
      "model_capability": "fast_model",
      "normalized_text": "tenho dúvidas sobre cobrança, pode me ajudar?"
    }
  },
  "result": {
    "category": "billing",
    "confidence": 0.9,
    "reason": "O usuário mencionou dúvidas sobre cobrança."
  }
}
```

Categorias possíveis: `billing`, `technical_support`, `account`, `cancellation`, `other`.

## Fingerprint

- **Fingerprint** é o conjunto de fatores que definem a resposta. A chave de cache é o
  SHA-256 desse fingerprint serializado de forma estável (`json.dumps(sort_keys=True)`).
- A chave **não depende mais só da mensagem**: a mesma pergunta com outro prompt ou
  outra versão de regras é outra resposta, logo outra chave.
- Campos do fingerprint: `prompt_version`, `rules_version`, `model_capability` e
  `normalized_text`.
- `PUT /config` altera essas versões **em runtime**, sem reiniciar o servidor — o que
  permite demonstrar a mudança de fingerprint sem perder o cache já em memória (que
  sumiria num restart).
- O cache continua **em memória** e some quando o servidor reinicia.
- `ai_call_number` só aumenta quando a IA é realmente chamada (cache miss).

## Como testar

Use o `test.http`:

1. Primeira chamada → `ai_model` (miss).
2. Mesma mensagem → `exact_cache` (hit), mesmo `ai_call_number`.
3. `PUT /config` mudando `prompt_version` para `prompt_v2`.
4. Mesma mensagem → `ai_model` (miss): o fingerprint mudou, a chave é outra.
5. `PUT /config` voltando para `prompt_v1`.
6. Mesma mensagem → `exact_cache` (hit): a chave antiga ainda está em memória.

## Próximo passo

O cache ainda é **exato**: mensagens com a mesma intenção mas texto diferente geram
chaves diferentes. Isso será resolvido com embeddings e **cache semântico** nas
próximas práticas — ainda não há embedding, pgvector nem busca por similaridade aqui.
