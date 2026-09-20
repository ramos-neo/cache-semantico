# Design

## Context

See proposal.md — Why. Depende do shell em `web/`. Contrato de telemetria já existe em `src/routes/tickets.ts`. Fingerprint/threshold em `runtimeConfig`.

## Goals / Non-Goals

**Goals:**

- UI Lab com formulário + timeline dirigida por `source` e blocos de telemetria
- DTOs TypeScript espelhando a resposta de analyze
- Estados loading / empty / error / success

**Non-Goals:**

- Runner de cenários em lote (change `web-cache-scenarios`)
- Histórico persistente / gráficos (change `web-cache-observability`)
- Alterar cascata no backend
- Streaming SSE

## Decisions

### 1. Timeline dirigida por dados da API
- **Choice:** mapear nós Exact → Semantic → AI a partir de `source` + flags `attempted`/`hit`/`decision`
- **Why:** a API já narra o caminho; UI não reimplementa a cascata
- **Alternatives:** simular localmente (errado pedagogicamente)

### 2. Config mínima no Lab
- **Choice:** mostrar threshold; edição via PUT opcional neste change
- **Why:** necessário para estudar falso positivo/miss; versões de fingerprint podem ser change futuro
- **Alternatives:** página Config separada (pode vir depois)

### 3. Feature folder `lab/`
- **Choice:** `web/src/app/features/lab/` com service `TicketsApi` compartilhado em `core/` se já existir
- **Why:** alinhado ao agent Angular (features/core/shared)

## Risks / Trade-offs

- [Cache exact some ao reiniciar API] → Documentar no Lab que exact é in-memory
- [Semantic precisa de DB + embedding] → Depende de docker + GEMINI_API_KEY; health do shell ajuda
- [Resposta grande/verbose] → Timeline resume; JSON bruto em painel expansível

## Migration Plan

1. Implementar após `web-app-shell`
2. Substituir placeholder `/lab`
3. Rollback: reverter feature lab; rota volta a “em breve”

## Open Questions

- Nenhuma bloqueante: edição completa de `prompt_version`/`rules_version` pode ficar para depois.
