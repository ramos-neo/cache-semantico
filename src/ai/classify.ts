import {
  GEMINI_MODEL,
  MODEL_TEMPERATURE,
} from "../config.js";
import {
  ticketAnalysisJsonSchema,
  ticketAnalysisSchema,
  type TicketAnalysis,
} from "../schemas/ticket.js";
import { gemini } from "./gemini-client.js";

const SYSTEM_PROMPT =
  "Você é um classificador de tickets de suporte.\n" +
  "Classifique a mensagem em uma das categorias: " +
  "billing, technical_support, account, cancellation, other.\n" +
  "Retorne uma confiança entre 0 e 1 e um motivo curto.\n" +
  "Não invente categorias fora da lista.";

export async function classifyTicket(message: string): Promise<TicketAnalysis> {
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Mensagem:\n${message}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: MODEL_TEMPERATURE,
      responseMimeType: "application/json",
      responseJsonSchema: ticketAnalysisJsonSchema,
    },
  });

  const content = response.text;
  if (!content) {
    throw new Error("Resposta vazia do modelo Gemini.");
  }

  return ticketAnalysisSchema.parse(JSON.parse(content));
}
