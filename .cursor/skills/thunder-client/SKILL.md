---
name: thunder-client
description: >-
  Guia do Thunder Client (extensão REST para Cursor/VS Code): requests, collections,
  environments, Save to Workspace, testes GUI, import/export e atalhos. Use quando o
  usuário mencionar Thunder Client, thunder-tests, coleções HTTP na IDE, ou quiser
  adaptar/criar chamadas de API no lugar de Postman/.http.
---

# Thunder Client

Cliente REST leve para Cursor/VS Code. Docs: [docs.thunderclient.com](https://docs.thunderclient.com/).

**Não usa arquivos `.http`.** Requests vivem na UI ou em JSON em `thunder-tests/` (Save to Workspace). Para `.http`, use REST Client (`humao.rest-client`).

## Pré-requisitos

- Extensão: **Thunder Client** (`rangav.vscode-thunder-client`)
- Node.js ≥ 18; Cursor/VS Code ≥ 1.85

## Fluxo básico

1. Ícone **Thunder Client** na Activity Bar
2. **New Request** (ou Command Palette → `Thunder Client: New Request`)
3. Método + URL → body/headers → enviar com `Cmd/Ctrl + Enter`
4. Resposta: status, headers, body, tempo; aba `{}` gera snippets (cURL, fetch, axios, etc.)

### Atalhos úteis

| Atalho | Ação |
|--------|------|
| `Cmd/Ctrl + Enter` | Enviar request |
| `Cmd/Ctrl + S` | Salvar sem enviar |
| `Cmd/Ctrl + E` | Trocar environment ativo |
| `Cmd/Ctrl + U` | Import cURL (pago) |
| `Alt + Shift + F` | Formatar body |

## Collections

1. Aba **Collections** → New Collection
2. Arraste requests ou crie dentro da collection/folder
3. Ordem importa em demos (ex.: cache miss → hit exato → hit semântico)

## Environments

Hierarquia (menor → maior precedência): OS env → Global → Local (secrets) → `.env` linkado → Active Env → Env da collection → vars de request (script).

Uso: `{{baseUrl}}`, `{{token}}` em URL, headers, body e tests.

```text
{{baseUrl}}/tickets/analyze
```

- Criar env na aba **Env** → `...` → **Set Active**
- Linkar `.env`: Env view → **Link to .env file** (`KEY=value`)
- Secrets: Local Environment (não vai pro Git)

Docs: [Environments](https://docs.thunderclient.com/features/environments).

## Save to Workspace (Git)

Persiste dados no repo em `thunder-tests/`.

Workspace settings (recomendado):

```json
{
  "thunder-client.saveToWorkspace": true
}
```

Reinicie a janela do Cursor após alterar. Docs: [Team Collaboration](https://docs.thunderclient.com/team).

### Formatos de DB

| Formato | Layout | Notas |
|--------|--------|-------|
| **v3** (default) | 1 arquivo por collection | Mais simples |
| **v4** (pago) | 1 arquivo por request | Melhor p/ merge em times |

### Layout clássico (ainda comum)

```text
thunder-tests/
├── thunderCollection.json   # metadados das collections
├── thunderclient.json       # requests
└── thunderEnvironment.json  # environments
```

### Layout v3 atual

```text
thunder-tests/
├── tc_col_<id>.json
└── tc_env_<id>.json
```

Não commitar tokens/secrets nos JSON de env.

## Testes (GUI)

Na request → aba **Tests** (scriptless):

- Status equals `200`
- JSON path (`json.source`) equals `exact_cache`
- Response time `<` N ms

Docs: [Testing](https://docs.thunderclient.com/get-started) → Assertions.

Scripting (quando necessário):

```js
tc.setVar("petId", tc.response.json.id);
tc.setVar("baseUrl", "http://localhost:8000", "request");
```

## Import / Export

**Pago** na maioria dos casos. Formatos: Postman 2.1, Insomnia, Hoppscotch, OpenAPI 3, Thunder Client.

- Import: Collections → menu → Import
- Export: botão direito na collection → Export
- cURL: `Cmd/Ctrl + U` ou Activity → Import cURL

Docs: [Import/Export](https://docs.thunderclient.com/features/import).

## Criar coleção a partir de um fluxo (ex.: `test.http`)

Quando o usuário pedir para adaptar `.http` / demo HTTP:

1. Ativar `thunder-client.saveToWorkspace`
2. Criar env `local` com `baseUrl`
3. Criar collection com requests na ordem do fluxo
4. Body JSON → `body.type: "json"` + `body.raw`
5. Headers: `Content-Type: application/json`
6. Tests mínimos: status 200 (+ asserts de telemetria se fizer sentido)
7. Atualizar README/AGENTS apontando para `thunder-tests/`

### Shape de request (referência)

```json
{
  "_id": "<uuid>",
  "colId": "<collection-uuid>",
  "containerId": "",
  "name": "1. Analyze - AI miss",
  "url": "{{baseUrl}}/tickets/analyze",
  "method": "POST",
  "headers": [{ "name": "Content-Type", "value": "application/json" }],
  "body": { "type": "json", "raw": "{\n  \"message\": \"...\"\n}" },
  "tests": [{ "type": "status", "custom": "status", "action": "equals", "value": 200 }]
}
```

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| Connection refused | Confirmar app no ar; tentar `127.0.0.1` no lugar de `localhost` |
| Collection não aparece | `saveToWorkspace: true` + Reload Window |
| Dev server reinicia ao salvar TC | Ignorar `thunder-tests/*` no watcher (nodemon/tsx) |
| `.http` sem "Send Request" | Thunder Client não executa `.http` — use a UI ou REST Client |

## O que o agente deve fazer

- Preferir `thunder-tests/` + env `{{baseUrl}}` neste projeto (não reinventar `.http` para TC)
- Manter requests na ordem didática do fluxo
- Nunca colocar `GEMINI_API_KEY` ou secrets em JSON versionado
- Atualizar README/AGENTS se o caminho da demo mudar
- Se pedirem só `.http`, esclarecer: REST Client vs Thunder Client

## Links

- [Welcome](https://docs.thunderclient.com/)
- [Get Started](https://docs.thunderclient.com/get-started)
- [Environments](https://docs.thunderclient.com/features/environments)
- [Team / Git Sync](https://docs.thunderclient.com/team)
- [Common / shortcuts](https://docs.thunderclient.com/features/common)
- [Code snippets](https://docs.thunderclient.com/features/code-snippet)
