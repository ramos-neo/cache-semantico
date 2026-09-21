import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ConfigUpdateRequest, RuntimeConfig } from './config.models';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getConfig() {
    return this.http.get<RuntimeConfig>(`${this.baseUrl}/config`);
  }

  updateConfig(body: ConfigUpdateRequest) {
    return this.http.put<RuntimeConfig>(`${this.baseUrl}/config`, body);
  }

  /** Atalho didático: só o threshold do cache semântico. */
  updateThreshold(threshold: number) {
    return this.updateConfig({ semantic_cache_threshold: threshold });
  }
}
