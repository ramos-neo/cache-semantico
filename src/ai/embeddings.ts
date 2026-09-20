import { OPENAI_EMBEDDING_MODEL } from "../config.js";
import { openai } from "./openai-client.js";

export async function embedQuery(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: texts,
  });
  return response.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}
