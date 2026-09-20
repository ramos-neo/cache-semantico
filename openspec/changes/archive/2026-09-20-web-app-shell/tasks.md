# Tasks

## 1. Scaffold

- [x] 1.1 Criar app Angular 22 standalone em `web/` (CLI) e verificar que `ng version` / estrutura `src/app` existem
- [x] 1.2 Adicionar Angular Material + theming SCSS base e verificar que o app compila (`ng build` ou `ng serve` sem erro)
- [x] 1.3 Criar `web/README.md` com comandos install/start e `baseUrl` da API; verificar que o README cita `localhost:8000`

## 2. Shell e rotas

- [x] 2.1 Implementar layout shell (header, nav, main + router-outlet) com landmarks semânticos e verificar no browser
- [x] 2.2 Registrar rotas placeholder `/lab`, `/cenarios`, `/observabilidade`, `/arquitetura` com páginas “em breve” e verificar navegação sem reload
- [x] 2.3 Aplicar tema Material (tokens/cores) distinto do padrão roxo genérico e verificar visual no shell

## 3. HTTP e saúde

- [x] 3.1 Configurar `baseUrl`/proxy de dev para a API Hono e verificar que um GET de health sai para o host esperado
- [x] 3.2 Implementar service tipado de health (`/health` e/ou `/db/status`) e indicador no shell; verificar estados healthy e unhealthy (API parada)
- [x] 3.3 Se necessário, ajustar CORS no Hono com mudança mínima e documentar; verificar chamada browser sem erro CORS

## 4. Integração no repositório

- [x] 4.1 Referenciar o frontend no README raiz (como subir `web/`) e verificar que o link/seção existe
- [x] 4.2 Confirmar que nenhum contrato de `src/routes` foi renomeado e que `npm run build` do backend ainda passa
