# Tasks

## 1. API client

- [x] 1.1 Criar DTOs TypeScript da request/response de `/tickets/analyze` e verificar tipagem sem `any` desnecessário
- [x] 1.2 Implementar service HTTP `analyze(message)` e verificar chamada real contra API local (ou mock de contrato)
- [x] 1.3 Implementar GET (e PUT opcional) de `/config` para threshold e verificar leitura no UI

## 2. Página Lab

- [x] 2.1 Substituir placeholder `/lab` pelo formulário de mensagem + botão enviar e verificar validação de vazio
- [x] 2.2 Implementar estados loading/erro/sucesso e verificar cada um (API ok, API down, submit vazio)
- [x] 2.3 Exibir `result` tipado (categoria etc.) após sucesso e verificar campos visíveis

## 3. Timeline da cascata

- [x] 3.1 Implementar componente de timeline Exact → Semantic → AI mapeando `source` e verificar destaque para `exact_cache`
- [x] 3.2 Verificar destaque e dados de similarity/threshold para resposta `semantic_cache`
- [x] 3.3 Verificar destaque AI + info de `semantic_cache_write` para resposta `ai_model`
- [x] 3.4 Exibir `elapsed_ms` e `ai_call_number` e verificar presença após sucesso

## 4. Fechamento

- [x] 4.1 Rodar o fluxo manual alinhado a `test.http` (1–3) pela UI e verificar sources esperados
- [x] 4.2 Confirmar que `src/` da cascata não foi alterado (diff limpo em rotas de tickets)
