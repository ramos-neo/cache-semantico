# Frontend — Cache Semântico (`web/`)

Portal Angular 22 + Material do projeto de estudo de cache semântico.

## Pré-requisitos

- Node.js **≥ 22.22.3** (requerido pelo Angular CLI 22)
- API Hono rodando em **`http://localhost:8000`** (raiz do repo: `npm run dev`)

## Instalar e subir

```bash
cd web
npm install
npm start
```

Abre em `http://localhost:4200`.

## API (`baseUrl`)

| Ambiente | `apiBaseUrl` | Como chega na Hono |
|----------|--------------|--------------------|
| Dev (`ng serve`) | `/api` | Proxy `proxy.conf.json`: `/api` → `http://localhost:8000` |
| Produção (build) | `http://localhost:8000` | Chamada direta (ajuste em `src/environments/environment.ts`) |

Os services HTTP usam `environment.apiBaseUrl` — **não** hardcode do host em componentes.

### CORS

Neste change **não** foi necessário habilitar CORS no Hono: o proxy do `ng serve` remove a restrição de origem em desenvolvimento. Se no futuro a UI chamar a API por URL absoluta a partir do browser (sem proxy/reverse-proxy), aí sim avalie CORS mínimo no backend.

## Scripts

| Comando | Função |
|---------|--------|
| `npm start` | `ng serve` + proxy `/api` |
| `npm run build` | build de produção |
| `npx ng version` | versões Angular |

## Estrutura

```
web/src/app/
├── layout/shell/       # header, nav, main + health
├── features/placeholder/
├── core/health/        # GET /health e /db/status
└── app.routes.ts       # /lab, /cenarios, /observabilidade, /arquitetura
```
