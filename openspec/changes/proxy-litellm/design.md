# Design

## Context

See proposal.md — Why. Hoje `src/ai/` usa `@google/genai` direto. Fase 2 do AGENTS menciona providers/LangChain; LiteLLM é gateway HTTP OpenAI-compatible, complementar. Frontend idealmente continua falando só com Hono.

## Goals / Non-Goals

**Goals:**

- Sidecar LiteLLM local documentado
- Flag env para Hono usar base URL do proxy
- Cascata exact/semantic intacta no Hono
- Docs de topologia

**Non-Goals:**

- Multi-tenant production gateway
- Substituir pgvector/exact por cache do LiteLLM
- LangChain (change separado se/quando pedido)
- Obrigar proxy no MVP do Lab

## Decisions

### 1. UI → Hono → LiteLLM → Provider
- **Choice:** proxy atrás do Hono, não entre Angular e Hono no v1
- **Why:** cascata e telemetria ficam num só lugar; UI simples
- **Alternatives:** Angular→LiteLLM (duplica orquestração); LiteLLM só embeddings (parcial)

### 2. Feature flag por env
- **Choice:** ex. `AI_PROXY_URL` vazio = direto; preenchido = via proxy
- **Why:** fácil de ligar/desligar no estudo
- **Alternatives:** sempre proxy (pior DX se LiteLLM cair)

### 3. Docker Compose ao lado do Postgres
- **Choice:** serviço em `docker/docker-compose.yml` ou compose overlay
- **Why:** mesmo hábito operacional do curso
- **Alternatives:** pip local only (menos reprodutível)

### 4. Escopo de models
- **Choice:** começar com modelo chat usado no classify; embeddings podem permanecer Gemini direto se LiteLLM embedding for atrito — documentar
- **Why:** reduzir risco do primeiro spike
- **Note:** se embeddings também passarem pelo proxy, tasks devem incluir validação de dimensões 1536

## Risks / Trade-offs

- [Compatibilidade Gemini via LiteLLM] → Spike cedo; fallback keep direct SDK
- [API keys em dois lugares] → Documentar env do compose; nunca commitar secrets
- [Complexidade operacional] → Proxy opcional; Lab funciona sem ele
- [Duplicar “cache” no LiteLLM] → Desabilitar cache do proxy; dono é Hono

## Migration Plan

1. Após Lab estável
2. Adicionar serviço + env + docs
3. Rollback: unset `AI_PROXY_URL`, parar container

## Open Questions

- Embeddings via LiteLLM no v1 ou só chat? **Default proposto:** chat via proxy primeiro; embeddings diretos até validar. Pode ser revisado no apply sem mudar a capability (ambos permanecem “provider behind optional proxy”).
