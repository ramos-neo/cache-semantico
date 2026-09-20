# AGENTS.md

Guia para agentes de IA (e humanos) trabalhando neste repositório.

## O que é este projeto

Analisador de tickets de suporte com **cascata de cache** para evitar chamadas desnecessárias ao LLM:

1. **Cache exato** (Map em memória, chave = SHA-256 do fingerprint) → `source: exact_cache`
2. **Cache semântico** (embedding + pgvector + threshold) → `source: semantic_cache`
3. **IA** (só no miss) → `source: ai_model` + grava no pgvector

Origem didática: [devfullcycle/mba-ia-cache](https://github.com/devfullcycle/mba-ia-cache).  
Repo ativo: [ramos-neo/cache-semantico](https://github.com/ramos-neo/cache-semantico).

## Stack principal (fonte da verdade)

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js + TypeScript (`"type": "module"`) |
| HTTP | Hono + `@hono/node-server` |
| Validação HTTP | Zod |
| IA (fase 1) | SDK oficial `@google/genai` — **JSON Schema** (`responseJsonSchema` + `responseMimeType: application/json`) |
| Embeddings | `gemini.models.embedContent` (`gemini-embedding-001`, 1536 dims) |
| Banco | Postgres 16 + pgvector (`docker/docker-compose.yml`) |
| Driver DB | `pg` |

**Não use LangChain na fase atual** — está reservado para a fase 2 (estudo). Ver seção abaixo.

## Duas bases de código

| Pasta | Papel |
|-------|--------|
| `src/` | **App principal** — TypeScript. Toda feature nova vai aqui. |
| `python/` | **Referência** do curso (FastAPI + LangChain). Não é o runtime padrão. |

- Não “sincronize” automaticamente Python ↔ TypeScript sem pedido explícito.
- Se alterar contratos de API em `src/`, atualize `test.http` e o README.
- Mudanças só em `python/` devem ser justificadas (estudo/comparação).

## Estrutura `src/`

```
src/
├── index.ts                 # bootstrap, initDb, porta 8000
├── app.ts                   # Hono app + onError (Zod → 400)
├── config.ts                # env + runtimeConfig mutável
├── log.ts                   # logBlock (logs didáticos)
├── fingerprint.ts           # normalize, buildFingerprint, buildCacheKey
├── schemas/ticket.ts        # Zod + ticketAnalysisJsonSchema (Gemini)
├── db/index.ts              # initDb, insert, searchSimilar (SQL)
├── ai/
│   ├── gemini-client.ts
│   ├── classify.ts          # generateContent + responseJsonSchema
│   └── embeddings.ts
├── cache/
│   ├── exact.ts             # Map + aiCallCount
│   └── semantic.ts          # evaluateBestMatch, saveAiResult
└── routes/
    ├── config.ts
    ├── db.ts
    ├── tickets.ts           # cascata /tickets/analyze
    ├── embeddings.ts
    └── semantic-cache.ts
```

Plano de port: [`.cursor/plans/port-hono-typescript.md`](.cursor/plans/port-hono-typescript.md).

## Convenções importantes

### Fingerprint

Composto por: `prompt_version` + `rules_version` + `model_capability` + `normalized_text`.  
Mudar qualquer versão em runtime (`PUT /config`) isola o cache semântico (filtro SQL) e invalida chaves do cache exato novas.

### Cascata — não quebrar

- Exact hit: **não** gera embedding, **não** consulta pgvector, **não** grava.
- Semantic hit: **não** chama IA, **não** grava item novo.
- AI path: grava exact + semantic; **reusa** o embedding já gerado na busca.
- Falha na gravação semântica: ainda assim retorna a resposta da IA (`saved: false`).
- `response_json` inválido no hit semântico → tratar como miss (não derrubar a API).

### Contratos de resposta

Manter campos de telemetria: `source`, `cache`, `semantic_cache`, `semantic_cache_write`, `ai_call_number`, `elapsed_ms`, `result`.  
Categorias do ticket: `billing | technical_support | account | cancellation | other`.

### Threshold

`semantic_cache_threshold`: `0 < t ≤ 1` (padrão `0.90`).  
Baixo → risco de falso positivo; alto → mais misses.

### Estilo de código

- TypeScript estrito; imports ESM com sufixo `.js` nos paths relativos.
- Preferir alterações mínimas e alinhadas à estrutura existente.
- Logs com `logBlock` no estilo didático do curso (blocos com separador).
- Respostas ao usuário do projeto: português (quando for comunicação).

### Segredos

- Nunca commitar `.env`.
- Usar `.env.example` sem chaves reais.
- `GEMINI_API_KEY` obrigatória para classify/embeddings.

## Como rodar (agente)

```bash
docker compose -f docker/docker-compose.yml up -d
cp .env.example .env   # se necessário; preencher GEMINI_API_KEY
npm install
npm run dev            # http://localhost:8000
```

Health / DB: `GET /health`, `GET /db/status`.  
Fluxo demo: Thunder Client (`thunder-tests/`, coleção `cache-semantico`) ou `test.http` (REST Client).

Python (referência): ver `python/README.md` — `cd python && python main.py`.

## Endpoints (não renomear sem necessidade)

| Método | Rota |
|--------|------|
| GET/PUT | `/config` |
| GET | `/db/status` |
| POST | `/tickets/analyze` |
| POST | `/embeddings/generate` |
| POST | `/semantic-cache/items` |
| POST | `/semantic-cache/search` |
| POST | `/semantic-cache/evaluate` |
| GET | `/health` |

## Fase 2 planejada — LangChain (ainda não fazer)

Quando for pedido explicitamente:

1. Extrair interfaces `Classifier` / `Embedder` em `src/ai/`
2. Manter implementação atual Gemini SDK
3. Adicionar `src/ai/langchain/` (LangChain.js)
4. Seleção via env `AI_PROVIDER=gemini|langchain`

Não instalar LangChain nem refatorar providers sem solicitação.

## O que evitar

- Introduzir Nest/Express/Fastify no lugar do Hono sem pedido.
- Trocar JSON Schema do Gemini por outro mecanismo de structured output na fase 1.
- Apagar `python/` (é referência intencional).
- Adicionar índice vetorial HNSW/Redis/TTL/PII policies a menos que seja a tarefa.
- Force push em `main` ou alterar git config.

## Commits e remote

- Remote: `https://github.com/ramos-neo/cache-semantico.git`
- Só criar commit/push quando o usuário pedir.
- Mensagens de commit em português ou inglês claro, focadas no “porquê”.
