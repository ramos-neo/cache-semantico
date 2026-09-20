import {
  MODEL_TEMPERATURE,
  OPENAI_MODEL,
} from "../config.js";
import {
  ticketAnalysisJsonSchema,
  ticketAnalysisSchema,
  type TicketAnalysis,
} from "../schemas/ticket.js";
import { openai } from "./openai-client.js";

const SYSTEM_PROMPT =
  "Você é um classificador de tickets de suporte.\n" +
  "Classifique a mensagem em uma das categorias: " +
  "billing, technical_support, account, cancellation, other.\n" +
  "Retorne uma confiança entre 0 e 1 e um motivo curto.\n" +
  "Não invente categorias fora da lista.";

export async function classifyTicket(message: string): Promise<TicketAnalysis> {
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: MODEL_TEMPERATURE,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Mensagem:\n${message}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ticket_analysis",
        strict: true,
        schema: ticketAnalysisJsonSchema,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia do modelo OpenAI.");
  }

  return ticketAnalysisSchema.parse(JSON.parse(content));
}
