import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnalysisHistoryEntry } from '../../core/observability/analysis-history.models';
import { AnalysisHistoryStore } from '../../core/observability/analysis-history.store';

@Component({
  selector: 'app-observabilidade',
  imports: [DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './observabilidade.html',
  styleUrl: './observabilidade.scss',
})
export class Observabilidade {
  private readonly history = inject(AnalysisHistoryStore);

  readonly entries = this.history.entries;
  readonly counts = this.history.countsBySource;
  readonly selectedId = signal<string | null>(null);

  readonly selected = computed<AnalysisHistoryEntry | null>(() => {
    const id = this.selectedId();
    if (!id) {
      return null;
    }
    return this.entries().find((e) => e.id === id) ?? null;
  });

  readonly isEmpty = computed(() => this.entries().length === 0);

  select(entry: AnalysisHistoryEntry): void {
    this.selectedId.set(entry.id === this.selectedId() ? null : entry.id);
  }

  clearHistory(): void {
    if (this.isEmpty()) {
      return;
    }
    const ok = window.confirm(
      'Limpar todo o histórico local de análises? Esta ação não pode ser desfeita.',
    );
    if (!ok) {
      return;
    }
    this.history.clear();
    this.selectedId.set(null);
  }

  messagePreview(message: string, max = 72): string {
    const trimmed = message.trim();
    if (trimmed.length <= max) {
      return trimmed;
    }
    return `${trimmed.slice(0, max)}…`;
  }

  sourceClass(source: string): string {
    switch (source) {
      case 'exact_cache':
        return 'obs__source--exact';
      case 'semantic_cache':
        return 'obs__source--semantic';
      case 'ai_model':
        return 'obs__source--ai';
      default:
        return 'obs__source--other';
    }
  }
}
