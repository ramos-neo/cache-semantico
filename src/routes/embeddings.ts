import { Hono } from "hono";
import { embedDocuments } from "../ai/embeddings.js";
import { OPENAI_EMBEDDING_MODEL } from "../config.js";
import { normalizeText } from "../fingerprint.js";
import { logBlock } from "../log.js";
import { embeddingsRequestSchema } from "../schemas/ticket.js";

export const embeddingsRoutes = new Hono();

embeddingsRoutes.post("/embeddings/generate", async (c) => {
  const body = embeddingsRequestSchema.parse(await c.req.json());

  if (body.texts.length === 0) {
    return c.json({ detail: "A lista de textos não pode estar vazia." }, 400);
  }

  const normalizedTexts = body.texts.map(normalizeText);
  if (normalizedTexts.some((n) => !n)) {
    return c.json(
      { detail: "Cada texto precisa ter conteúdo após a normalização." },
      400,
    );
  }

  const start = performance.now();
  const vectors = await embedDocuments(normalizedTexts);
  const elapsedMs = Math.trunc(performance.now() - start);

  const items = body.texts.map((text, index) => ({
    text,
    normalized_text: normalizedTexts[index],
    embedding_dimension: vectors[index].length,
    embedding_preview: vectors[index].slice(0, 5),
  }));

  logBlock("🔢 Embeddings gerados", {
    model: OPENAI_EMBEDDING_MODEL,
    texts_count: items.length,
    dimension: items[0]?.embedding_dimension ?? 0,
    elapsed_ms: `${elapsedMs}ms`,
  });

  return c.json({ model: OPENAI_EMBEDDING_MODEL, items });
});
