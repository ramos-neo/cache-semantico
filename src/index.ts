import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { initDb } from "./db/index.js";
import { logBlock } from "./log.js";

const port = Number(process.env.PORT ?? "8000");

async function main() {
  try {
    await initDb();
  } catch (error) {
    logBlock("❌ Falha ao inicializar o banco", {
      erro: error instanceof Error ? error.message : String(error),
      dica: "O Postgres está no ar? Rode: docker compose up -d",
    });
  }

  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
    console.log(`Servidor em http://localhost:${info.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
