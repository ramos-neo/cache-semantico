# Design

## Context

See proposal.md — Why. Sem endpoint de métricas no Hono. Lab/cenários já produzem respostas analyze.

## Goals / Non-Goals

**Goals:**

- Store client-side + página de lista/agregação
- Hook de gravação reutilizável (service) chamado após analyze sucesso

**Non-Goals:**

- Prometheus/Grafana, backend de telemetria
- Multi-usuário / sync entre browsers
- PII policies avançadas (estudo local; mensagem fica só no browser)

## Decisions

### 1. localStorage + session option
- **Choice:** service `AnalysisHistoryStore` com persistência em `localStorage` (limite documentado)
- **Why:** sobrevive a refresh; suficiente para estudo
- **Alternatives:** só memória (perde refresh); IndexedDB (overkill)

### 2. Integração via service compartilhado
- **Choice:** Lab e Scenarios chamam `history.record(response, message)` 
- **Why:** uma ingestão, múltiplos produtores

### 3. UI simples Material
- **Choice:** tabela/lista + chips de contagem por source; sem charts libs no v1
- **Why:** menos deps; charts podem vir depois com CDK ou lib leve

## Risks / Trade-offs

- [localStorage cheio] → Limitar N entradas (ex. 100) FIFO
- [Mensagens sensíveis no browser] → Aviso didático na página; clear fácil
- [Duplicação se Lab e Scenario ambos gravam] → Intencional (cada analyze conta)

## Migration Plan

1. Após Lab
2. Rota `/observabilidade`
3. Rollback: remover store + página

## Open Questions

- Nenhuma bloqueante.
