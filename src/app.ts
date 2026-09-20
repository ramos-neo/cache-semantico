import { Hono } from "hono";
import { ZodError } from "zod";
import { configRoutes } from "./routes/config.js";
import { dbRoutes } from "./routes/db.js";
import { embeddingsRoutes } from "./routes/embeddings.js";
import { semanticCacheRoutes } from "./routes/semantic-cache.js";
import { ticketsRoutes } from "./routes/tickets.js";

export const app = new Hono();

app.onError((error, c) => {
  if (error instanceof ZodError) {
    return c.json({ detail: error.flatten() }, 400);
  }
  console.error(error);
  return c.json(
    { detail: error instanceof Error ? error.message : String(error) },
    500,
  );
});

app.route("/", configRoutes);
app.route("/", dbRoutes);
app.route("/", ticketsRoutes);
app.route("/", embeddingsRoutes);
app.route("/", semanticCacheRoutes);

app.get("/health", (c) => c.json({ ok: true }));
