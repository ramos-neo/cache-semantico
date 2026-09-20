import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DbStatusResponse,
  HealthResponse,
  HealthState,
} from './health.models';

type HealthResult = HealthResponse | { ok: false; error: string };

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly state = signal<HealthState>('checking');
  readonly lastError = signal<string | null>(null);

  getHealth() {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  getDbStatus() {
    return this.http.get<DbStatusResponse>(`${this.baseUrl}/db/status`);
  }

  /** Atualiza o indicador do shell; nunca propaga erro (não derruba a UI). */
  refresh() {
    this.state.set('checking');
    this.lastError.set(null);

    return forkJoin({
      health: this.getHealth().pipe(
        catchError((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Falha ao contatar /health';
          return of({ ok: false, error: message } satisfies HealthResult);
        }),
      ),
      db: this.getDbStatus().pipe(
        catchError(() =>
          of<DbStatusResponse>({
            connected: false,
            pgvector_enabled: false,
            embedding_dimensions: 0,
            table: null,
            error: 'unreachable',
          }),
        ),
      ),
    }).pipe(
      map(({ health, db }) => {
        const healthOk = health.ok === true;
        const healthy = healthOk && db.connected;
        return { healthy, health, db };
      }),
      tap(({ healthy, health }) => {
        if (healthy) {
          this.state.set('healthy');
          this.lastError.set(null);
          return;
        }
        this.state.set('unhealthy');
        const errMsg =
          'error' in health && health.error
            ? health.error
            : 'API ou banco indisponível';
        this.lastError.set(errMsg);
      }),
    );
  }
}
