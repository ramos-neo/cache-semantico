# Proposal

## Why

A evolução natural do estudo é introduzir uma camada intermediária de proxy/gateway (LiteLLM) entre a UI (ou o Hono) e os providers, para routing multi-modelo, observabilidade de LLM e desacoplamento. Este change formaliza essa fase futura sem misturá-la ao MVP do Lab.

## What Changes

- Introduzir LiteLLM (ou equivalente documentado) como proxy entre a aplicação e o(s) provider(s)
- Definir configuração local (Docker Compose ou processo sidecar) para o proxy
- Ajustar a app Hono e/ou o frontend para falar com o proxy quando habilitado (feature flag / env)
- Documentar o diagrama de camadas App | Proxy | Provider na prática
- Manter a cascata de cache no Hono como dona do exact/semantic
- **Não** substitui o Lab; complementa a arquitetura de estudo

## Capabilities

### New Capabilities

- `litellm-proxy`: camada proxy LiteLLM para estudo de gateway entre aplicação e providers de IA

### Modified Capabilities

- (nenhuma — specs principais ainda vazias; deltas futuros podem tocar AI provider quando existir capability)

## Impact

- Novo serviço no `docker/` ou compose
- Possíveis mudanças em `src/ai/` (base URL / client) atrás de env
- Frontend pode continuar apontando só para Hono (recomendado) enquanto Hono usa o proxy
- Dependências: Lab estável; idealmente após shell + lab
