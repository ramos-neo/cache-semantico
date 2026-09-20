# Proposal

## Why

A plataforma de estudo do cache semântico precisa de um frontend Angular dedicado. Hoje só existem Thunder Client e `test.http`; sem um shell web compartilhado, cada feature (lab, cenários, portal) reinventaria layout, HTTP e navegação. Este change cria a base mínima para os demais.

## What Changes

- Criar aplicativo Angular 22 em `web/` (standalone, TypeScript estrito)
- Integrar Angular Material com tema próprio (não “AI purple” genérico)
- Layout de portal: header, navegação lateral/top, área `main` com router outlet
- Rotas placeholder para Lab, Cenários, Observabilidade, Arquitetura (conteúdo vazio ou “em breve”)
- Cliente HTTP tipado com `baseUrl` configurável apontando para a API Hono (`http://localhost:8000`)
- Indicador de saúde do ambiente via `GET /health` e/ou `GET /db/status`
- Documentar como subir o frontend no README (ou `web/README.md`)
- **Não** alterar contratos da API em `src/`

## Capabilities

### New Capabilities

- `web-shell`: shell Angular do portal de estudo — layout, navegação, cliente HTTP base e status do backend

### Modified Capabilities

- (nenhuma — specs principais ainda vazias)

## Impact

- Nova pasta `web/` com dependências Angular/Material (package próprio)
- Scripts de desenvolvimento (ex.: `npm start` em `web/`)
- CORS: pode exigir ajuste mínimo no Hono se o browser bloquear — só se necessário e documentado
- Changes dependentes: `web-cache-lab`, `web-cache-scenarios`, `web-cache-observability`, `web-study-portal`
