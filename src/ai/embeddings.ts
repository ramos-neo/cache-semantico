import {
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
} from "../config.js";
import { gemini } from "./gemini-client.js";

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const response = await gemini.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: texts,
    config: {
      outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
    },
  });

  const embeddings = response.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error(
      `Gemini retornou ${embeddings.length} embeddings para ${texts.length} textos.`,
    );
  }

  return embeddings.map((item, index) => {
    const values = item.values;
    if (!values?.length) {
      throw new Error(`Embedding vazio na posição ${index}.`);
    }
    return values;
  });
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  return embedTexts(texts);
}
