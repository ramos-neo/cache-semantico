# Proposal

## Why

Além de operar o Lab, a plataforma deve ensinar arquitetura: camadas (aplicação, proxy/gateway, provider), fluxos e trechos de código reutilizáveis. Sem páginas didáticas, o portal vira só um cliente HTTP. Este change entrega o conteúdo estático/interativo leve de estudo.

## What Changes

- Páginas do portal didático (ex.: `/arquitetura` e subseções se necessário)
- Diagramas de arquitetura e da cascata (estáticos e/ou levemente interativos)
- Explicação das camadas: App (Hono) | Proxy/Gateway (LiteLLM futuro) | Provider (Gemini)
- Trechos relevantes alinhados a `src/` (fingerprint, exact, semantic evaluate, classify) — citação didática, não editor de código
- Glossário curto (fingerprint, threshold, embedding, source)
- Stub “LiteLLM (próximo)” apontando para o change `proxy-litellm`
- Depende de `web-app-shell`; pode paralelizar com Lab após o shell

## Capabilities

### New Capabilities

- `study-portal`: conteúdo didático de arquitetura, fluxos e snippets para estudo do cache semântico

### Modified Capabilities

- (nenhuma)

## Impact

- Conteúdo e componentes em `web/`
- Pode referenciar arquivos de `src/` apenas como material de estudo (sem alterar runtime)
- Sem LiteLLM real neste change
