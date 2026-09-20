# Proposal

## Why

Após várias interações no Lab, o aluno precisa ver padrões (quantos hits exact vs semantic vs AI, latências). A API não expõe um stream de métricas; um histórico local na UI basta para estudo e evita inventar backend de telemetria cedo.

## What Changes

- Página Observabilidade (`/observabilidade`)
- Registro client-side de cada resposta de analyze (sessão e/ou `localStorage`)
- Agregações simples: contagem por `source`, médias/lista de `elapsed_ms`, `ai_call_number`
- Filtro/lista do histórico com detalhe do request
- Integração com o Lab: cada analyze bem-sucedido alimenta o histórico
- Depende de `web-cache-lab` e `web-app-shell`

## Capabilities

### New Capabilities

- `cache-observability`: observabilidade client-side das análises de ticket para estudo da cascata

### Modified Capabilities

- (nenhuma)

## Impact

- Feature Angular + storage local no browser
- Sem novos endpoints no Hono
- Dados não são multi-dispositivo nem persistidos no servidor
