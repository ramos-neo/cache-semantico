# Design

## Context

See proposal.md — Why. Conteúdo didático; pode avançar em paralelo ao Lab após o shell. Fontes: `AGENTS.md`, `README.md`, `src/`.

## Goals / Non-Goals

**Goals:**

- Páginas de conteúdo com diagramas ASCII/SVG/CSS e seções claras
- Snippets curados (copiáveis) alinhados ao código real — atualização manual ok no v1
- Callout LiteLLM futuro

**Non-Goals:**

- CMS, markdown remoto, sync automático Python↔TS
- Implementar LiteLLM (change `proxy-litellm`)
- Editor de código / execução de snippets

## Decisions

### 1. Conteúdo no próprio Angular
- **Choice:** componentes/templates (ou markdown estático importado) versionados no repo
- **Why:** simples, offline, mesmo deploy do `web/`
- **Alternatives:** Notion/externo (quebra o portal único)

### 2. Diagramas
- **Choice:** diagramas em template (HTML/SVG/CSS) + ASCII onde útil; Mermaid só se já houver toolchain sem atrito
- **Why:** evitar deps pesadas no MVP didático
- **Alternatives:** só imagens PNG (piores de manter)

### 3. Snippets
- **Choice:** trechos curtos ilustrativos + path de arquivo (`src/...`) para o aluno abrir no IDE
- **Why:** evita drift de copiar arquivos inteiros; não viola copyright de material externo

## Risks / Trade-offs

- [Drift código vs snippet] → Tasks de revisão ao mudar cascata; preferir paths + trechos mínimos
- [Portal grande demais] → Limitar a Arquitetura + Cascata + Glossário + Snippets no v1

## Migration Plan

1. Após shell (paralelo ao Lab)
2. Preencher `/arquitetura` (+ rotas filhas se necessário)
3. Rollback: placeholders

## Open Questions

- Nenhuma bloqueante.
