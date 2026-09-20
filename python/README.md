# Referência Python (MBA Full Cycle)

Código original do curso ([mba-ia-cache](https://github.com/devfullcycle/mba-ia-cache)), mantido para comparação com o port TypeScript em `src/`.

## Rodar

Na raiz do repositório (usa o mesmo `docker-compose.yml` e `.env`):

```bash
docker compose up -d
python -m venv .venv
source .venv/bin/activate
pip install -r python/requirements.txt
cp .env.example .env   # se ainda não existir
python python/main.py
```

Os imports (`config`, `db`, `models`, `log_helpers`) resolvem porque o processo sobe com cwd na pasta `python/` — rode assim:

```bash
cd python && python main.py
```

Ou, da raiz:

```bash
PYTHONPATH=python python python/main.py
```
