import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface CodeRef {
  path: string;
  title: string;
  responsibility: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

@Component({
  selector: 'app-arquitetura',
  imports: [MatIconModule],
  templateUrl: './arquitetura.html',
  styleUrl: './arquitetura.scss',
})
export class Arquitetura {
  readonly glossary: GlossaryTerm[] = [
    {
      term: 'fingerprint',
      definition:
        'Texto composto por prompt_version + rules_version + model_capability + texto normalizado. É a base da chave do cache exact e do isolamento do cache semântico no SQL.',
    },
    {
      term: 'threshold',
      definition:
        'Limiar de similaridade do cache semântico (0 < t ≤ 1, padrão 0.90). Abaixo do limiar = miss; muito baixo aumenta falso positivo, muito alto aumenta misses.',
    },
    {
      term: 'embedding',
      definition:
        'Vetor numérico (1536 dims via gemini-embedding-001) que representa o significado do fingerprint. Usado em busca por similaridade no pgvector.',
    },
    {
      term: 'source',
      definition:
        'Campo de telemetria da resposta: exact_cache (hit exato), semantic_cache (hit por similaridade) ou ai_model (miss — IA foi chamada).',
    },
  ];

  readonly codeRefs: CodeRef[] = [
    {
      path: 'src/fingerprint.ts',
      title: 'Fingerprint e chave',
      responsibility:
        'Normaliza a mensagem, monta o fingerprint com as versões de runtime e deriva a chave SHA-256 do cache exact.',
    },
    {
      path: 'src/cache/exact.ts',
      title: 'Cache exact',
      responsibility:
        'Map em memória keyed pelo SHA-256. Hit: devolve o resultado sem embedding, sem pgvector e sem gravação.',
    },
    {
      path: 'src/cache/semantic.ts',
      title: 'Evaluate e save semântico',
      responsibility:
        'evaluateBestMatch decide accept/reject pelo threshold; saveAiResultToSemanticCache grava só no caminho AI (reusa o embedding da busca).',
    },
    {
      path: 'src/ai/classify.ts',
      title: 'Classificação (IA)',
      responsibility:
        'Chama Gemini com responseJsonSchema. Só entra no fluxo quando exact e semantic deram miss.',
    },
    {
      path: 'src/routes/tickets.ts',
      title: 'Cascata /tickets/analyze',
      responsibility:
        'Orquestra exact → semantic → AI e monta a telemetria (source, cache, semantic_cache, semantic_cache_write).',
    },
  ];
}
