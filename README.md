# Analisador de Tickets — pgvector e persistência de embeddings

Analisador de tickets de suporte usando IA com LangChain e FastAPI.

Esta versão adiciona **Postgres com pgvector** e passa a **salvar embeddings no
banco**. Antes o embedding era só gerado e devolvido pela API; agora ele vira dado
persistido, para ser consultado nas próximas práticas.

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

Os resultados são apenas **candidatos**: esta etapa **não** aplica threshold, **não**
decide cache hit e **não** altera o `/tickets/analyze`. Essa decisão vem na próxima
prática, usando um limiar de similaridade sobre esses candidatos.
