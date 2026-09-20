# Design

## Context

See proposal.md — Why. Backend is Hono on port 8000 (`src/`). No frontend exists yet. Agent Angular do repo: Angular 22 + Material, pasta `web/`, REST tipado, standalone/signals. Demais changes (`web-cache-lab`, etc.) consomem este shell.

## Goals / Non-Goals

**Goals:**

- Scaffold Angular 22 standalone em `web/` com Material e tema coerente
- Layout + rotas lazy-ready com placeholders
- `HttpClient` + service de health + `baseUrl` via environment
- Base para features sem acoplar lógica de cache neste change

**Non-Goals:**

- Lab, cenários, observabilidade, páginas didáticas (changes seguintes)
- LiteLLM / proxy
- Auth, multi-usuário, SSR
- Alterar cascata ou contratos em `src/` (exceto CORS mínimo se bloqueador)

## Decisions

### 1. Pasta `web/` com package próprio
- **Choice:** `web/` independente (`package.json` próprio), não monorepo Nx
- **Why:** alinhado ao agent Angular; isolamento claro do backend Node
- **Alternatives:** app na raiz (mistura deps); Nx (overhead para estudo)

### 2. Angular 22 + Material + standalone
- **Choice:** standalone components, signals, `inject()`, control flow moderno
- **Why:** padrão do agent do projeto; Material cobre shell/nav sem libs extras
- **Alternatives:** React/Vue (fora do escopo do agent); CSS puro (mais trabalho de layout)

### 3. Proxy de dev vs CORS no Hono
- **Choice preferido:** proxy do `ng serve` para `/api` → `localhost:8000`, UI usa path relativo
- **Fallback:** habilitar CORS no Hono só se proxy for insuficiente
- **Why:** evita CORS em dev; LiteLLM futuro pode ser outra origem
- **Alternatives:** só CORS no Hono (simples, mas menos portável)

### 4. Rotas placeholder
- **Choice:** rotas nomeadas já reservadas (`/lab`, `/cenarios`, `/observabilidade`, `/arquitetura`) com páginas “em breve”
- **Why:** navegação estável para changes paralelos sem renomear depois

### 5. Tema visual
- **Choice:** tema Material 3 com tokens SCSS próprios (evitar roxo genérico “AI”)
- **Why:** regra UX do agent; estudo ainda merece identidade clara

## Risks / Trade-offs

- [Versão exata Angular CLI / Material] → Mitigação: pinar versões compatíveis na criação do projeto; validar `ng build`
- [CORS vs proxy] → Mitigação: documentar a opção escolhida em `web/README.md`
- [Shell sem conteúdo parece “vazio”] → Aceitável; Lab chega no próximo change

## Migration Plan

1. Criar `web/` e scripts de start
2. Documentar no README raiz ou `web/README.md`
3. Rollback: remover `web/` (sem impacto no backend)

## Open Questions

- Nenhuma que bloqueie specs/tasks: porta do `ng serve` (padrão 4200) é suficiente.
