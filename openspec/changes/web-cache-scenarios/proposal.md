# Proposal

## Why

O roteiro 0–4 do `test.http` é o coração didático do curso (AI → exact → semantic → AI diferente). Manualmente no Lab é fácil “errar a ordem”. Este change orquestra esses cenários com asserts visuais de `source` esperado.

## What Changes

- Página Cenários (`/cenarios`) com o roteiro alinhado a `test.http`
- Execução sequencial (ou passo a passo) dos requests
- Assert visual: esperado vs obtido (`ai_model` | `exact_cache` | `semantic_cache`)
- Opção de ajustar threshold (passo 0) via `PUT /config` antes do roteiro
- Histórico do run do cenário na sessão (pass/fail por passo)
- Depende de `web-cache-lab` (cliente de analyze) e `web-app-shell`

## Capabilities

### New Capabilities

- `cache-scenarios`: orquestração didática dos cenários de validação da cascata com asserts de `source`

### Modified Capabilities

- (nenhuma)

## Impact

- Feature Angular em `web/`
- Usa `/config` e `/tickets/analyze`
- Não altera backend além do já existente
