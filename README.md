# Analisador de Tickets — cache semântico no fluxo principal

Analisador de tickets de suporte usando IA com LangChain e FastAPI, com Postgres +
pgvector para cache semântico.

## Cache no /tickets/analyze

Agora o `/tickets/analyze` tenta o cache **antes** de chamar a IA e, no fim, **grava**
o novo resultado. A ordem é:

1. **Cache exato** (fingerprint em memória) → `source: exact_cache`.
2. Se não houver, **cache semântico**: gera o embedding, busca no pgvector e avalia o
   melhor candidato contra o `semantic_cache_threshold`. Se passar no corte →
   `source: semantic_cache` (usa o `response_json` salvo, **sem** chamar a IA).
3. Se não houver candidato aceito → chama a IA → `source: ai_model`.
4. **Gravação no cache semântico**: no caminho da IA (e só nele), a resposta é salva no
   pgvector reaproveitando o embedding já gerado no passo 2 — assim uma próxima
   mensagem parecida pode ser resolvida por `semantic_cache`.

A resposta traz `semantic_cache` (avaliação: `decision`, `threshold`, `best_match`…) e
`semantic_cache_write` (gravação: `attempted`, `saved`, `reason`, `item_id`,
`embedding_dimension`). A gravação **só acontece quando a IA é chamada**: em exact hit e
semantic hit nada novo é gravado. Se a gravação falhar, a resposta da IA é retornada
mesmo assim (`saved: false`, erro no log).

O `semantic_cache_threshold` é ajustável em runtime pelo `PUT /config` (0 < t ≤ 1) —
subir o corte gera mais misses, baixar aceita mais (e arrisca falso positivo). Ainda
**não** há política avançada do que pode ou não ser cacheado (confiança mínima, dados
sensíveis): por ora toda resposta de IA vira item do cache semântico.

## Organização do código

- `main.py` — app FastAPI, endpoints e fluxo (chama funções do `db.py`).
- `db.py` — conexão, extensão `vector`, tabela, índice e inserção (SQL fica aqui).
- `models.py` — modelos Pydantic.
- `config.py` — `.env`, configs e fábricas de modelo LangChain.
- `log_helpers.py` — log em bloco.

## Subir o banco (Docker)

```bash
docker compose up -d
```

Isso sobe um Postgres com pgvector (imagem `pgvector/pgvector:pg16`).

Para parar: `docker compose down`. Para apagar os dados: `docker compose down -v`.

## Rodar a aplicação

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Preencha `OPENAI_API_KEY` no `.env`. No startup, a aplicação habilita a extensão
`vector`, cria a tabela `ai_response_cache` e o índice de fingerprint. Se o Postgres
não estiver no ar, o erro aparece claro no terminal.

## Endpoints novos

```http
GET  /db/status              # valida conexão, pgvector e existência da tabela
POST /semantic-cache/items   # gera embedding e salva um item no Postgres
```

Entrada do `/semantic-cache/items`:

```json
{
  "input_text": "Como cancelo minha assinatura?",
  "response_json": {
    "category": "cancellation",
    "confidence": 0.92,
    "reason": "O usuário quer cancelar a assinatura."
  }
}
```

A resposta traz os dados do item e apenas um `embedding_preview` (5 números). O vetor
completo **não** é retornado — ele fica salvo na coluna `embedding VECTOR(1536)`.

## Busca por similaridade

```http
POST /semantic-cache/search
```

Agora dá para **buscar respostas parecidas** no pgvector. O endpoint recebe um texto
novo, normaliza, gera o embedding com LangChain e compara com os embeddings **já
salvos** usando o operador de distância `<=>` do pgvector, filtrando pelo fingerprint
atual (`prompt_version`, `rules_version`, `model_capability`).

```json
{ "input_text": "Preciso cancelar meu plano", "limit": 5 }
```

Cada item retorna `distance` (quanto menor, mais próximo) e `similarity` (`1 -
distance`, só para leitura didática). `limit` é opcional (padrão 5, máximo 10).

Os resultados são apenas **candidatos**: a busca só encontra parecidos, não decide se
podem ser reutilizados.

## Avaliação com threshold

```http
POST /semantic-cache/evaluate
```

O **threshold** é o corte mínimo de similaridade para aceitar o melhor candidato. O
endpoint busca os candidatos, pega o mais próximo (`best_match`) e compara com o
threshold:

```json
{ "input_text": "Preciso cancelar meu plano", "threshold": 0.9, "limit": 5 }
```

- `decision: accepted` — `best_match.similarity >= threshold`.
- `decision: rejected` — similaridade abaixo do threshold, ou nenhum candidato.

O ajuste do threshold é um trade-off: **baixo** demais aceita **falso positivo**
(reutiliza uma resposta que só parece próxima — ex.: "cancelar meu plano" vs "cancelar
minha reunião"); **alto** demais gera mais **misses** (chama a IA à toa). Por isso
*parecido não significa automaticamente reutilizável*.

Esta etapa ainda **não** integra ao `/tickets/analyze` e **não** chama o modelo nem
grava no banco — só demonstra a decisão. A integração no fluxo principal vem depois.
