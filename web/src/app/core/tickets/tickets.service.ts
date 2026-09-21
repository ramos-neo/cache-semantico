import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  TicketAnalyzeRequest,
  TicketAnalyzeResponse,
} from './tickets.models';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Envia a mensagem para a cascata exact → semantic → AI. */
  analyze(message: string) {
    const body: TicketAnalyzeRequest = { message };
    return this.http.post<TicketAnalyzeResponse>(
      `${this.baseUrl}/tickets/analyze`,
      body,
    );
  }
}
