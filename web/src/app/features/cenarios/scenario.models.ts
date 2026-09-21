import { AnalyzeSource } from '../../core/tickets/tickets.models';

/** Tipos de passo do roteiro didático (espelha test.http). */
export type ScenarioStepKind = 'config' | 'analyze';

export type ScenarioStepStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed';

export interface ScenarioConfigStep {
  id: string;
  kind: 'config';
  label: string;
  description: string;
  /** Threshold enviado em PUT /config. */
  threshold: number;
}

export interface ScenarioAnalyzeStep {
  id: string;
  kind: 'analyze';
  label: string;
  description: string;
  message: string;
  expectedSource: AnalyzeSource;
}

export type ScenarioStep = ScenarioConfigStep | ScenarioAnalyzeStep;

/** Resultado de um passo após execução (ou erro). */
export interface ScenarioStepResult {
  status: ScenarioStepStatus;
  /** source retornado pela API (só analyze). */
  actualSource?: AnalyzeSource;
  errorMessage?: string;
  elapsedMs?: number;
}

/**
 * Roteiro canônico 0–4 alinhado a `test.http`:
 * config threshold → AI → exact → semantic → AI (mensagem diferente).
 */
export const CASCADE_SCENARIO_STEPS: readonly ScenarioStep[] = [
  {
    id: '0',
    kind: 'config',
    label: '0. Threshold padrão',
    description: 'PUT /config com semantic_cache_threshold = 0.9',
    threshold: 0.9,
  },
  {
    id: '1',
    kind: 'analyze',
    label: '1. Primeira mensagem',
    description: 'Sem cache → chama a IA e salva no pgvector',
    message: 'Quero cancelar meu plano',
    expectedSource: 'ai_model',
  },
  {
    id: '2',
    kind: 'analyze',
    label: '2. Mesma mensagem',
    description: 'Cache exato em memória',
    message: 'Quero cancelar meu plano',
    expectedSource: 'exact_cache',
  },
  {
    id: '3',
    kind: 'analyze',
    label: '3. Mensagem parecida',
    description: 'Cache semântico, sem chamar a IA',
    message: 'Preciso cancelar meu plano',
    expectedSource: 'semantic_cache',
  },
  {
    id: '4',
    kind: 'analyze',
    label: '4. Mensagem diferente',
    description: 'Sem candidato bom → chama a IA de novo',
    message: 'Meu aplicativo está travando ao abrir',
    expectedSource: 'ai_model',
  },
] as const;
