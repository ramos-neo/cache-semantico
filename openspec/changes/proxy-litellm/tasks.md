# Tasks

## 1. Spike e compose

- [ ] 1.1 Documentar/adicionar serviço LiteLLM no Docker Compose de estudo e verificar que o container sobe e responde health/na URL local
- [ ] 1.2 Validar um request de chat via proxy para o provider configurado e verificar resposta não vazia (spike)

## 2. Integração Hono

- [ ] 2.1 Introduzir env `AI_PROXY_URL` (ou nome documentado) e verificar que vazio preserva comportamento Gemini SDK atual
- [ ] 2.2 Quando proxy URL definida, rotear classify (chat) via proxy e verificar `POST /tickets/analyze` ainda retorna telemetria `source`
- [ ] 2.3 Garantir que exact/semantic continuam no Hono (teste: exact hit não chama provider) e verificar `source=exact_cache`
- [ ] 2.4 Decidir embeddings (direto vs proxy) conforme spike; documentar a escolha e verificar classify path ok

## 3. Docs e portal

- [ ] 3.1 Documentar topologia UI→Hono→LiteLLM→Provider e toggle on/off no README/`web` study notes
- [ ] 3.2 Atualizar callout do study portal (se existir) de “futuro” para “opcional local” e verificar texto
- [ ] 3.3 Confirmar `.env.example` sem secrets reais e com variáveis do proxy documentadas
