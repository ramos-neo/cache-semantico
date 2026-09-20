import type { TicketAnalysis } from "../schemas/ticket.js";

const CACHE = new Map<string, TicketAnalysis>();

let aiCallCount = 0;

export function getExactCache(key: string): TicketAnalysis | undefined {
  return CACHE.get(key);
}

export function setExactCache(key: string, value: TicketAnalysis): void {
  CACHE.set(key, value);
}

export function getAiCallCount(): number {
  return aiCallCount;
}

export function incrementAiCallCount(): number {
  aiCallCount += 1;
  return aiCallCount;
}
