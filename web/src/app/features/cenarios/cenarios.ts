import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../../core/config/config.service';
import { AnalysisHistoryStore } from '../../core/observability/analysis-history.store';
import { TicketsService } from '../../core/tickets/tickets.service';
import {
  CASCADE_SCENARIO_STEPS,
  ScenarioStep,
  ScenarioStepResult,
  ScenarioStepStatus,
} from './scenario.models';

function emptyResults(count: number): ScenarioStepResult[] {
  return Array.from({ length: count }, () => ({ status: 'pending' as const }));
}

@Component({
  selector: 'app-cenarios',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cenarios.html',
  styleUrl: './cenarios.scss',
})
export class Cenarios {
  private readonly tickets = inject(TicketsService);
  private readonly config = inject(ConfigService);
  private readonly history = inject(AnalysisHistoryStore);

  readonly steps = CASCADE_SCENARIO_STEPS;

  readonly results = signal<ScenarioStepResult[]>(
    emptyResults(CASCADE_SCENARIO_STEPS.length),
  );
  readonly running = signal(false);
  /** Índice do próximo passo pendente (0-based). */
  readonly nextIndex = signal(0);
  readonly runnerError = signal<string | null>(null);

  readonly summary = computed(() => {
    const list = this.results();
    const decided = list.filter(
      (r) => r.status === 'passed' || r.status === 'failed',
    );
    if (decided.length === 0) {
      return null;
    }
    const passed = decided.filter((r) => r.status === 'passed').length;
    const failed = decided.filter((r) => r.status === 'failed').length;
    const allDone = decided.length === list.length;
    return { passed, failed, total: list.length, allDone };
  });

  readonly canRunNext = computed(
    () => !this.running() && this.nextIndex() < this.steps.length,
  );

  readonly canRunAll = computed(
    () => !this.running() && this.nextIndex() < this.steps.length,
  );

  readonly canReset = computed(
    () => !this.running() && this.nextIndex() > 0,
  );

  expectedLabel(step: ScenarioStep): string {
    if (step.kind === 'config') {
      return '— (config)';
    }
    return step.expectedSource;
  }

  statusIcon(status: ScenarioStepStatus): string {
    switch (status) {
      case 'passed':
        return 'check_circle';
      case 'failed':
        return 'cancel';
      case 'running':
        return 'hourglass_empty';
      default:
        return 'radio_button_unchecked';
    }
  }

  statusLabel(status: ScenarioStepStatus): string {
    switch (status) {
      case 'passed':
        return 'pass';
      case 'failed':
        return 'fail';
      case 'running':
        return 'rodando';
      default:
        return 'pendente';
    }
  }

  reset(): void {
    if (this.running()) {
      return;
    }
    this.results.set(emptyResults(this.steps.length));
    this.nextIndex.set(0);
    this.runnerError.set(null);
  }

  async runNext(): Promise<void> {
    if (!this.canRunNext()) {
      return;
    }
    this.runnerError.set(null);
    this.running.set(true);
    try {
      await this.executeAt(this.nextIndex());
    } finally {
      this.running.set(false);
    }
  }

  async runAll(): Promise<void> {
    if (!this.canRunAll()) {
      return;
    }
    this.runnerError.set(null);
    this.running.set(true);
    try {
      while (this.nextIndex() < this.steps.length) {
        await this.executeAt(this.nextIndex());
      }
    } finally {
      this.running.set(false);
    }
  }

  private async executeAt(index: number): Promise<void> {
    const step = this.steps[index];
    this.patchResult(index, { status: 'running' });

    try {
      if (step.kind === 'config') {
        await firstValueFrom(this.config.updateThreshold(step.threshold));
        this.patchResult(index, { status: 'passed' });
      } else {
        const res = await firstValueFrom(this.tickets.analyze(step.message));
        this.history.record(res, step.message);
        const passed = res.source === step.expectedSource;
        this.patchResult(index, {
          status: passed ? 'passed' : 'failed',
          actualSource: res.source,
          elapsedMs: res.elapsed_ms,
          errorMessage: passed
            ? undefined
            : `Esperado ${step.expectedSource}, obtido ${res.source}`,
        });
      }
    } catch (err: unknown) {
      this.patchResult(index, {
        status: 'failed',
        errorMessage: this.describeHttpError(err),
      });
    }

    this.nextIndex.set(index + 1);
  }

  private patchResult(index: number, patch: Partial<ScenarioStepResult>): void {
    this.results.update((list) => {
      const next = [...list];
      next[index] = { ...next[index], ...patch };
      return next;
    });
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
