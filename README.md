# Analisador de Tickets — cache semântico (TypeScript + Hono)

Analisador de tickets de suporte com IA (OpenAI SDK + JSON Schema), Fast-style API em **Hono**, e Postgres + pgvector para cache semântico.

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
src/
├── index.ts              # bootstrap + initDb
├── app.ts                # Hono app
├── config.ts             # env + runtime config
├── log.ts
├── fingerprint.ts
├── schemas/ticket.ts     # Zod + JSON Schema (OpenAI)
├── db/index.ts           # pgvector
├── ai/                   # OpenAI classify + embeddings
├── cache/                # exact + semantic helpers
└── routes/               # endpoints
```

## Subir o banco (Docker)

```bash
docker compose up -d
```

Postgres com pgvector (`pgvector/pgvector:pg16`). Para apagar dados: `docker compose down -v`.

## Rodar a aplicação

```bash
npm install
cp .env.example .env
# Preencha OPENAI_API_KEY no .env
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

Use [test.http](test.http) para exercitar o fluxo do zero.

## IA (fase 1)

- SDK oficial `openai`
- Classificação via `response_format: json_schema` (strict)
- Embeddings via `embeddings.create`

## Fase 2 (estudo) — LangChain

Ainda **não** implementado. Ideia:

- Interfaces `Classifier` / `Embedder` em `src/ai/`
- Provider atual: OpenAI SDK
- Próximo: `src/ai/langchain/` com LangChain.js, selecionável por `AI_PROVIDER=openai|langchain`

## Threshold

- **Baixo** demais → risco de falso positivo (reutiliza resposta só “parecida”)
- **Alto** demais → mais misses (chama a IA à toa)

*Parecido não significa automaticamente reutilizável.*
