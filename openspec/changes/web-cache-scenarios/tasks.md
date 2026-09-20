# Tasks

## 1. Modelo de cenário

- [ ] 1.1 Definir modelo de passos (config + analyze) espelhando `test.http` e verificar expected `source` por passo
- [ ] 1.2 Renderizar lista de passos na rota `/cenarios` e verificar ordem e expectativas visíveis

## 2. Runner

- [ ] 2.1 Implementar execução sequencial completa usando services de config/analyze e verificar que os 4 analyze steps disparam na ordem
- [ ] 2.2 Implementar modo passo a passo e verificar que só o próximo passo executa
- [ ] 2.3 Implementar assert expected vs actual `source` e verificar pass e fail com respostas controladas/reais
- [ ] 2.4 Exibir resumo pass/fail ao final e verificar contagem correta

## 3. Robustez

- [ ] 3.1 Tratar erro de rede/API no passo sem derrubar o runner e verificar marcação de falha com mensagem
- [ ] 3.2 Documentar pré-requisitos (API, DB, chave) na página e verificar texto visível
- [ ] 3.3 Rodar o roteiro feliz (AI→exact→semantic→AI) manualmente e verificar todos os asserts verdes
