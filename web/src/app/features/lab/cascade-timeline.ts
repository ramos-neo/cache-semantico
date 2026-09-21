import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketAnalyzeResponse } from '../../core/tickets/tickets.models';

type StageId = 'exact' | 'semantic' | 'ai';
type StageRole = 'answer' | 'miss' | 'skipped' | 'idle';

interface CascadeStage {
  id: StageId;
  label: string;
  role: StageRole;
  detail: string;
}

@Component({
  selector: 'app-cascade-timeline',
  imports: [MatIconModule],
  templateUrl: './cascade-timeline.html',
  styleUrl: './cascade-timeline.scss',
})
export class CascadeTimeline {
  readonly response = input.required<TicketAnalyzeResponse>();

  readonly stages = computed(() => this.buildStages(this.response()));

  private buildStages(res: TicketAnalyzeResponse): CascadeStage[] {
    const source = res.source;
    const exactHit = source === 'exact_cache' || res.cache.hit;
    const semanticHit = source === 'semantic_cache' || res.semantic_cache.hit;
    const aiAnswer = source === 'ai_model';

    const exact: CascadeStage = {
      id: 'exact',
      label: 'Exact cache',
      role: exactHit ? 'answer' : 'miss',
      detail: exactHit
        ? 'Hit em memória — embedding, pgvector e IA não foram usados.'
        : `Miss (chave ${res.cache.key.slice(0, 8)}…)`,
    };

    let semantic: CascadeStage;
    if (exactHit) {
      semantic = {
        id: 'semantic',
        label: 'Semantic cache',
        role: 'skipped',
        detail: 'Pulado (exact hit).',
      };
    } else if (semanticHit) {
      const sim = res.semantic_cache.best_match_similarity;
      const thr = res.semantic_cache.threshold;
      const simText =
        sim != null ? `similaridade ${(sim * 100).toFixed(1)}%` : 'similaridade n/d';
      semantic = {
        id: 'semantic',
        label: 'Semantic cache',
        role: 'answer',
        detail: `Hit no pgvector — ${simText} ≥ threshold ${(thr * 100).toFixed(0)}%. IA não chamada.`,
      };
    } else {
      semantic = {
        id: 'semantic',
        label: 'Semantic cache',
        role: res.semantic_cache.attempted ? 'miss' : 'skipped',
        detail: res.semantic_cache.reason || 'Sem candidato acima do threshold.',
      };
    }

    let ai: CascadeStage;
    if (exactHit || semanticHit) {
      ai = {
        id: 'ai',
        label: 'AI model',
        role: 'skipped',
        detail: 'Não chamado — resposta veio do cache.',
      };
    } else if (aiAnswer) {
      const write = res.semantic_cache_write;
      const writeText = write.attempted
        ? write.saved
          ? 'gravação semântica: salva'
          : `gravação semântica: falhou (${write.reason})`
        : `gravação: ${write.reason}`;
      ai = {
        id: 'ai',
        label: 'AI model',
        role: 'answer',
        detail: `Miss completo — IA respondeu; ${writeText}.`,
      };
    } else {
      ai = {
        id: 'ai',
        label: 'AI model',
        role: 'idle',
        detail: 'Sem dados de caminho AI nesta resposta.',
      };
    }

    return [exact, semantic, ai];
  }

  stageIcon(role: StageRole): string {
    switch (role) {
      case 'answer':
        return 'check_circle';
      case 'miss':
        return 'cancel';
      case 'skipped':
        return 'skip_next';
      default:
        return 'radio_button_unchecked';
    }
  }

  stageRoleLabel(role: StageRole): string {
    switch (role) {
      case 'answer':
        return 'Respondeu';
      case 'miss':
        return 'Miss';
      case 'skipped':
        return 'Pulado';
      default:
        return '—';
    }
  }
}
