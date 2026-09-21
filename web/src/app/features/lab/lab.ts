import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfigService } from '../../core/config/config.service';
import { AnalysisHistoryStore } from '../../core/observability/analysis-history.store';
import { TicketAnalyzeResponse } from '../../core/tickets/tickets.models';
import { TicketsService } from '../../core/tickets/tickets.service';
import { CascadeTimeline } from './cascade-timeline';

type LabViewState = 'idle' | 'loading' | 'success' | 'error' | 'validation';

const CATEGORY_LABELS: Record<string, string> = {
  billing: 'Cobrança',
  technical_support: 'Suporte técnico',
  account: 'Conta',
  cancellation: 'Cancelamento',
  other: 'Outro',
};

@Component({
  selector: 'app-lab',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CascadeTimeline,
  ],
  templateUrl: './lab.html',
  styleUrl: './lab.scss',
})
export class Lab implements OnInit {
  private readonly tickets = inject(TicketsService);
  private readonly config = inject(ConfigService);
  private readonly history = inject(AnalysisHistoryStore);

  readonly message = signal('');
  readonly viewState = signal<LabViewState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly response = signal<TicketAnalyzeResponse | null>(null);

  readonly threshold = signal<number | null>(null);
  readonly thresholdDraft = signal('0.90');
  readonly configError = signal<string | null>(null);
  readonly configSaving = signal(false);
  readonly configLoaded = signal(false);

  ngOnInit(): void {
    this.loadConfig();
  }

  submit(): void {
    const text = this.message().trim();
    if (!text) {
      this.viewState.set('validation');
      this.errorMessage.set('Digite uma mensagem não vazia para analisar.');
      this.response.set(null);
      return;
    }

    this.viewState.set('loading');
    this.errorMessage.set(null);
    this.response.set(null);

    this.tickets.analyze(text).subscribe({
      next: (res) => {
        this.history.record(res, text);
        this.response.set(res);
        this.viewState.set('success');
      },
      error: (err: unknown) => {
        this.response.set(null);
        this.viewState.set('error');
        this.errorMessage.set(this.describeHttpError(err));
      },
    });
  }

  loadConfig(): void {
    this.configError.set(null);
    this.config.getConfig().subscribe({
      next: (cfg) => {
        this.threshold.set(cfg.semantic_cache_threshold);
        this.thresholdDraft.set(cfg.semantic_cache_threshold.toFixed(2));
        this.configLoaded.set(true);
      },
      error: (err: unknown) => {
        this.configLoaded.set(false);
        this.configError.set(this.describeHttpError(err, 'Falha ao ler /config'));
      },
    });
  }

  saveThreshold(): void {
    const raw = this.thresholdDraft().trim().replace(',', '.');
    const value = Number(raw);
    if (!(value > 0 && value <= 1)) {
      this.configError.set(
        'Threshold inválido: use um número entre 0 (exclusivo) e 1.',
      );
      return;
    }

    this.configSaving.set(true);
    this.configError.set(null);
    this.config.updateThreshold(value).subscribe({
      next: (cfg) => {
        this.threshold.set(cfg.semantic_cache_threshold);
        this.thresholdDraft.set(cfg.semantic_cache_threshold.toFixed(2));
        this.configSaving.set(false);
      },
      error: (err: unknown) => {
        this.configSaving.set(false);
        this.configError.set(
          this.describeHttpError(err, 'Falha ao atualizar threshold'),
        );
      },
    });
  }

  categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }

  confidencePercent(confidence: number): string {
    return `${(confidence * 100).toFixed(0)}%`;
  }

  private describeHttpError(
    err: unknown,
    fallback = 'Falha ao chamar a API',
  ): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'API indisponível. Confira se o backend está em localhost:8000.';
      }
      const detail =
        typeof err.error === 'object' &&
        err.error &&
        'detail' in err.error &&
        typeof (err.error as { detail: unknown }).detail === 'string'
          ? (err.error as { detail: string }).detail
          : null;
      return detail ?? `${fallback} (HTTP ${err.status}).`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  }
}
