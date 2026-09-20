# Tasks

## 1. Store

- [ ] 1.1 Implementar `AnalysisHistoryStore` (append, list, clear, limite) com `localStorage` e verificar persistência após refresh
- [ ] 1.2 Tipar entrada de histórico e verificar campos obrigatórios (`source`, `elapsed_ms`, message, timestamp)

## 2. Ingestão

- [ ] 2.1 Integrar gravação no fluxo de sucesso do Lab e verificar nova entrada após analyze
- [ ] 2.2 Integrar gravação no runner de cenários (se já existir) e verificar entradas por passo analyze

## 3. Página Observabilidade

- [ ] 3.1 Substituir placeholder `/observabilidade` por lista ordenada e verificar ordem newest-first
- [ ] 3.2 Implementar detalhe da entrada e verificar telemetria visível
- [ ] 3.3 Implementar agregação por `source` e verificar contagens
- [ ] 3.4 Implementar clear history com confirmação e verificar lista/agregações vazias
- [ ] 3.5 Exibir aviso de dado local/estudo e verificar texto presente
