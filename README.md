# Analisador de Tickets — cache semântico (TypeScript + Hono)

Analisador de tickets de suporte com IA (Gemini SDK + JSON Schema), Fast-style API em **Hono**, e Postgres + pgvector para cache semântico.

Port do projeto didático [devfullcycle/mba-ia-cache](https://github.com/devfullcycle/mba-ia-cache) para TypeScript.

## Cache no `/tickets/analyze`

A ordem é:

1. **Cache exato** (fingerprint em memória) → `source: exact_cache`
2. Se não houver, **cache semântico**: embedding + busca no pgvector + `semantic_cache_threshold` → `source: semantic_cache`
3. Se não houver candidato aceito → chama a IA (JSON Schema) → `source: ai_model`
4. **Gravação no cache semântico** só no caminho da IA, reaproveitando o embedding do passo 2

A gravação **só acontece quando a IA é chamada**. O `semantic_cache_threshold` é ajustável em runtime pelo `PUT /config` (0 < t ≤ 1).

## Organização do código

```
src/                      # app principal (TypeScript + Hono)
├── index.ts
├── app.ts
├── config.ts
├── log.ts
├── fingerprint.ts
├── schemas/ticket.ts
├── db/
├── ai/
├── cache/
└── routes/

web/                      # portal Angular 22 + Material
├── src/app/
└── README.md

python/                   # referência do curso (FastAPI + LangChain)
├── main.py
├── db.py
├── models.py
├── config.py
├── log_helpers.py
└── requirements.txt
```

O código Python original fica em [`python/`](python/) para estudo/comparação. Ver [python/README.md](python/README.md).

## Frontend (portal Angular)

O shell do portal de estudo fica em [`web/`](web/) (Angular 22 + Material, package próprio).

```bash
# Terminal 1 — API
npm run dev

# Terminal 2 — UI (proxy /api → http://localhost:8000)
cd web && npm install && npm start
```

Abre `http://localhost:4200`. Detalhes, `baseUrl` e CORS: [web/README.md](web/README.md).

## Subir o banco (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

Postgres com pgvector (`pgvector/pgvector:pg16`). Para apagar dados: `docker compose -f docker/docker-compose.yml down -v`.

## Rodar a aplicação

```bash
npm install
cp .env.example .env
# Preencha GEMINI_API_KEY no .env
npm run dev
```

Servidor em `http://localhost:8000`. No startup a app habilita a extensão `vector`, cria a tabela `ai_response_cache` e o índice de fingerprint.

Build de produção:

```bash
npm run build
npm start
```

## Endpoints

| Método | Rota | Função |
|--------|------|--------|
| `GET`/`PUT` | `/config` | Lê/ajusta threshold e versões |
| `GET` | `/db/status` | Saúde do Postgres/pgvector |
| `POST` | `/tickets/analyze` | Cascata de cache + classificação |
| `POST` | `/embeddings/generate` | Gera embeddings |
| `POST` | `/semantic-cache/items` | Insere item manualmente |
| `POST` | `/semantic-cache/search` | Busca candidatos parecidos |
| `POST` | `/semantic-cache/evaluate` | Avalia com threshold |

Use a coleção **Thunder Client** em [`thunder-tests/`](thunder-tests/) (env `local`, requests 0→4) ou o espelho [test.http](test.http) com REST Client.

## IA (fase 1)

- SDK oficial `@google/genai`
- Classificação via `responseJsonSchema` + `application/json`
- Embeddings via `embedContent` (`gemini-embedding-001`, 1536 dims)

## Fase 2 (estudo) — LangChain

Ainda **não** implementado. Ideia:

- Interfaces `Classifier` / `Embedder` em `src/ai/`
- Provider atual: Gemini SDK
- Próximo: `src/ai/langchain/` com LangChain.js, selecionável por `AI_PROVIDER=gemini|langchain`

## Threshold

- **Baixo** demais → risco de falso positivo (reutiliza resposta só “parecida”)
- **Alto** demais → mais misses (chama a IA à toa)

*Parecido não significa automaticamente reutilizável.*
