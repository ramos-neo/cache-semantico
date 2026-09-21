# Proposal

## Why

O valor didático central da plataforma é ver a cascata exact → semantic → AI em ação. Sem um Lab interativo, o aluno continua dependendo de Thunder/`test.http`. Este change entrega a página de mensagem + timeline alimentada pela telemetria real de `POST /tickets/analyze`.

## What Changes

- Página Lab (`/lab`) no shell Angular: campo de mensagem, envio, estados loading/erro/sucesso
- Timeline visual da cascata com base em `source`, `cache`, `semantic_cache`, `semantic_cache_write`, `elapsed_ms`, `ai_call_number`
- Exibição do `result` (categoria, urgência, etc.) tipado conforme o contrato da API
- Controles básicos de config no Lab ou link para threshold via `GET`/`PUT /config` (mínimo para estudar isolamento)
- Integração REST tipada; sem inventar endpoints
- Depende de `web-app-shell` estar aplicado (ou shell mínimo presente)

## Capabilities

### New Capabilities

- `cache-lab`: laboratório interativo que envia tickets e visualiza o caminho da cascata de cache

### Modified Capabilities

- (nenhuma)

## Impact

- Feature Angular em `web/` (rotas/services/componentes do Lab)
- Consome `/tickets/analyze` e opcionalmente `/config`
- Não altera a cascata em `src/`
- Desbloqueia `web-cache-scenarios` e `web-cache-observability`
