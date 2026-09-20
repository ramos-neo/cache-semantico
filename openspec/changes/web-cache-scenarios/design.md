# Design

## Context

See proposal.md — Why. Roteiro canônico em `test.http`. Reutiliza o client de analyze do Lab.

## Goals / Non-Goals

**Goals:**

- Modelo de cenário declarativo (passos + expected source)
- Runner sequencial e passo a passo com asserts
- UX clara de pass/fail

**Non-Goals:**

- Framework de testes E2E (Playwright) como entrega principal
- Mutação do backend
- Cenários arbitrários editáveis pelo usuário (v1 pode ser script fixo)

## Decisions

### 1. Script fixo alinhado a test.http
- **Choice:** constante/config no frontend espelhando passos 0–4
- **Why:** fidelidade didática; evita drift
- **Alternatives:** importar `.http` (complexo); UI editor de cenários (depois)

### 2. Reuso do TicketsApi / ConfigApi
- **Choice:** mesmos services do Lab
- **Why:** uma fonte de verdade HTTP

### 3. Estado do run em signals
- **Choice:** estado do runner em signals na feature
- **Why:** padrão Angular moderno do projeto

## Risks / Trade-offs

- [Exact miss se API reiniciou entre passos] → Instruir a rodar sequência completa sem restart; opcional aviso
- [Semantic miss por threshold/DB vazio] → Passo 0 seta threshold; documentar pré-requisito docker + dados do passo 1
- [Flaky por latência/API key] → Mostrar erro de passo vs assert fail

## Migration Plan

1. Após Lab
2. Preencher rota `/cenarios`
3. Rollback: placeholder

## Open Questions

- Nenhuma bloqueante.
