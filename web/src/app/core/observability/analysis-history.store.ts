import { Injectable, computed, signal } from '@angular/core';
import { TicketAnalyzeResponse } from '../tickets/tickets.models';
import {
  ANALYSIS_HISTORY_MAX_ENTRIES,
  ANALYSIS_HISTORY_STORAGE_KEY,
  AnalysisHistoryEntry,
  SourceCounts,
} from './analysis-history.models';

@Injectable({ providedIn: 'root' })
export class AnalysisHistoryStore {
  private readonly entriesSignal = signal<AnalysisHistoryEntry[]>(
    this.loadFromStorage(),
  );

  /** Lista newest-first (imutável para consumidores). */
  readonly entries = this.entriesSignal.asReadonly();

  readonly countsBySource = computed<SourceCounts>(() => {
    const counts: SourceCounts = {
      exact_cache: 0,
      semantic_cache: 0,
      ai_model: 0,
      other: 0,
      total: 0,
    };
    for (const entry of this.entriesSignal()) {
      counts.total += 1;
      switch (entry.source) {
        case 'exact_cache':
          counts.exact_cache += 1;
          break;
        case 'semantic_cache':
          counts.semantic_cache += 1;
          break;
        case 'ai_model':
          counts.ai_model += 1;
          break;
        default:
          counts.other += 1;
      }
    }
    return counts;
  });

  /**
   * Grava uma análise bem-sucedida no histórico (FIFO com limite).
   * Não deve ser chamado em falhas HTTP.
   */
  record(response: TicketAnalyzeResponse, message: string): AnalysisHistoryEntry {
    const entry: AnalysisHistoryEntry = {
      id: this.createId(),
      timestamp: new Date().toISOString(),
      message,
      source: response.source,
      elapsed_ms: response.elapsed_ms,
      ai_call_number: response.ai_call_number,
      category: response.result?.category,
      confidence: response.result?.confidence,
      reason: response.result?.reason,
    };

    this.entriesSignal.update((list) => {
      const next = [entry, ...list];
      return next.slice(0, ANALYSIS_HISTORY_MAX_ENTRIES);
    });
    this.persist();
    return entry;
  }

  list(): AnalysisHistoryEntry[] {
    return this.entriesSignal();
  }

  clear(): void {
    this.entriesSignal.set([]);
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(
        ANALYSIS_HISTORY_STORAGE_KEY,
        JSON.stringify(this.entriesSignal()),
      );
    } catch {
      // Quota / private mode — histórico segue em memória nesta sessão.
    }
  }

  private loadFromStorage(): AnalysisHistoryEntry[] {
    try {
      const raw = localStorage.getItem(ANALYSIS_HISTORY_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item): item is AnalysisHistoryEntry => this.isValidEntry(item))
        .slice(0, ANALYSIS_HISTORY_MAX_ENTRIES);
    } catch {
      return [];
    }
  }

  private isValidEntry(value: unknown): value is AnalysisHistoryEntry {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const v = value as Record<string, unknown>;
    return (
      typeof v['id'] === 'string' &&
      typeof v['timestamp'] === 'string' &&
      typeof v['message'] === 'string' &&
      typeof v['source'] === 'string' &&
      typeof v['elapsed_ms'] === 'number' &&
      typeof v['ai_call_number'] === 'number'
    );
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
