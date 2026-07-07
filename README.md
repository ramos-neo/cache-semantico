# Analisador de Tickets — Cache exato (cache-aside)

Analisador de tickets de suporte usando IA com LangChain e FastAPI.

Esta versão adiciona **cache exato em memória** com o padrão **cache-aside**: a
aplicação procura no cache antes de chamar a IA. Se encontrar, retorna o resultado
cacheado; se não, chama o modelo e guarda o resultado para as próximas vezes.

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

Saída (cache miss — IA chamada):

```json
{
  "source": "ai_model",
  "ai_call_number": 1,
  "elapsed_ms": 1234,
  "cache": {
    "hit": false,
    "key": "...",
    "normalized_text": "tenho dúvidas sobre cobrança, pode me ajudar?"
  },
  "result": {
    "category": "billing",
    "confidence": 0.9,
    "reason": "O usuário mencionou dúvidas sobre cobrança."
  }
}
```

Categorias possíveis: `billing`, `technical_support`, `account`, `cancellation`, `other`.

## Cache exato

- **Cache exato** aqui significa: mesma mensagem (após normalização) → mesma chave →
  mesma resposta, sem chamar a IA de novo. A chave é o SHA-256 do texto normalizado
  (sem espaços extras e em minúsculas).
- O cache é **em memória** (um dicionário). Ele **desaparece quando o servidor
  reinicia**.
- `source = ai_model`: a IA foi chamada (cache miss).
- `source = exact_cache`: a resposta veio do cache (cache hit).
- `ai_call_number` **não aumenta** quando há cache hit — só cresce quando a IA é
  realmente chamada.

## Como testar

Use o arquivo `test.http` (VS Code REST Client ou similar):

1. Primeira chamada → `source: ai_model`, `cache.hit: false`.
2. Segunda chamada igual → `source: exact_cache`, `cache.hit: true`, mesmo
   `ai_call_number`.
3. Mesma mensagem com espaços e maiúsculas → ainda é `exact_cache`, graças à
   normalização.

## Limitação e próximo passo

O cache é **exato**: qualquer diferença que a normalização não trate (uma palavra a
mais, sinônimo, pontuação diferente) gera uma chave nova e chama a IA. Na próxima
prática isso evolui com **fingerprint**.
