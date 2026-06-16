import { describe, it, expect } from 'vitest';
import {
  computeReadySet,
  computeReviewSet,
  pickBatch,
  toSchedulable,
  type SchedulableTask,
} from '../runner/scheduler.js';

function t(
  id: string,
  status: SchedulableTask['status'],
  opts?: {
    deps?: string[];
    blocks?: string[];
    targetAgent?: string;
    capacity?: 'haiku' | 'sonnet' | 'opus-spike';
  },
): SchedulableTask {
  return {
    id,
    status,
    dependencies: opts?.deps ?? [],
    blocks: opts?.blocks ?? [],
    targetAgent: opts?.targetAgent,
    capacity: opts?.capacity,
  };
}

describe('scheduler', () => {
  describe('computeReadySet', () => {
    it('task draft com dep done → pronta', () => {
      const tasks = [t('A', 'draft', { deps: ['B'] }), t('B', 'done')];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });

    it('task draft sem dependencias → pronta', () => {
      const tasks = [t('A', 'draft')];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });

    it('task draft com dep in_progress → NÃO pronta', () => {
      const tasks = [t('A', 'draft', { deps: ['B'] }), t('B', 'in_progress')];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('task ready → pronta (se deps ok)', () => {
      const tasks = [t('A', 'ready'), t('B', 'done')];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });

    it('task rework → pronta (se deps ok)', () => {
      const tasks = [t('A', 'rework'), t('B', 'done')];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });

    it('task com blocker de entrada não-done → NÃO pronta', () => {
      const tasks = [
        t('A', 'draft'),
        t('B', 'in_progress', { blocks: ['A'] }),
      ];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('task com blocker de entrada done → pronta', () => {
      const tasks = [
        t('A', 'draft'),
        t('B', 'done', { blocks: ['A'] }),
      ];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });

    it('task com ambas as condições de bloqueio — dep ok mas blocker de entrada NÃO → NÃO pronta', () => {
      const tasks = [
        t('A', 'draft', { deps: ['C'] }),
        t('B', 'in_progress', { blocks: ['A'] }),
        t('C', 'done'),
      ];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('dep ausente do conjunto → NÃO pronta (conservador)', () => {
      const tasks = [t('A', 'draft', { deps: ['B'] })];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('status review → NÃO no ready-set', () => {
      const tasks = [t('A', 'review')];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('status in_progress → NÃO no ready-set', () => {
      const tasks = [t('A', 'in_progress')];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('status done → NÃO no ready-set', () => {
      const tasks = [t('A', 'done')];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('status blocked → NÃO no ready-set', () => {
      const tasks = [t('A', 'blocked')];
      expect(computeReadySet(tasks)).toEqual([]);
    });

    it('duas tasks prontas, ambas retornadas', () => {
      const tasks = [t('A', 'draft'), t('B', 'ready'), t('C', 'done')];
      const result = computeReadySet(tasks).map((x) => x.id).sort();
      expect(result).toEqual(['A', 'B']);
    });

    it('grafo com múltiplos níveis de dependência', () => {
      const tasks = [
        t('A', 'draft', { deps: ['B'] }),
        t('B', 'done'),
        t('C', 'draft', { deps: ['A'] }), // A não pronta → C não pronta
        t('D', 'done'),
      ];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });

    it('task com blocker de entrada indireto — apenas blocker direto importa', () => {
      const tasks = [
        t('A', 'draft'),
        t('B', 'done', { blocks: ['A'] }),
        t('C', 'in_progress', { blocks: ['B'] }), // B não é bloqueada por C para propósito de A
      ];
      expect(computeReadySet(tasks).map((x) => x.id)).toEqual(['A']);
    });
  });

  describe('computeReviewSet', () => {
    it('só retorna tasks em review', () => {
      const tasks = [
        t('A', 'review'),
        t('B', 'done'),
        t('C', 'in_progress'),
        t('D', 'review'),
      ];
      expect(computeReviewSet(tasks).map((x) => x.id)).toEqual(['A', 'D']);
    });

    it('conjunto vazio', () => {
      expect(computeReviewSet([])).toEqual([]);
    });

    it('nenhuma em review', () => {
      const tasks = [t('A', 'draft'), t('B', 'done')];
      expect(computeReviewSet(tasks)).toEqual([]);
    });
  });

  describe('pickBatch', () => {
    it('respeita k=2 e ordena por id', () => {
      const tasks = [
        t('C', 'draft'),
        t('A', 'draft'),
        t('B', 'draft'),
      ];
      const result = pickBatch(tasks, 2, []);
      expect(result.map((x) => x.id)).toEqual(['A', 'B']);
    });

    it('exclui inFlightIds', () => {
      const tasks = [t('A', 'draft'), t('B', 'draft'), t('C', 'draft')];
      const result = pickBatch(tasks, 3, ['B']);
      expect(result.map((x) => x.id)).toEqual(['A', 'C']);
    });

    it('k=0 → []', () => {
      expect(pickBatch([t('A', 'draft')], 0, [])).toEqual([]);
    });

    it('k<0 → []', () => {
      expect(pickBatch([t('A', 'draft')], -1, [])).toEqual([]);
    });

    it('batch vazio se ready vazio', () => {
      expect(pickBatch([], 3, [])).toEqual([]);
    });

    it('todas excluídas → []', () => {
      const tasks = [t('A', 'draft'), t('B', 'draft')];
      expect(pickBatch(tasks, 2, ['A', 'B'])).toEqual([]);
    });

    it('k maior que disponíveis → retorna todas disponíveis', () => {
      const tasks = [t('A', 'draft')];
      expect(pickBatch(tasks, 10, []).map((x) => x.id)).toEqual(['A']);
    });
  });

  describe('toSchedulable', () => {
    it('mapeia frontmatter básico', () => {
      const record = {
        frontmatter: {
          id: 'T-001',
          status: 'draft' as const,
          dependencies: ['T-000'],
          blocks: ['T-002'],
          target_agent: 'logic_agent',
        },
      };
      const result = toSchedulable(record);
      expect(result.id).toBe('T-001');
      expect(result.status).toBe('draft');
      expect(result.dependencies).toEqual(['T-000']);
      expect(result.blocks).toEqual(['T-002']);
      expect(result.targetAgent).toBe('logic_agent');
      expect(result.capacity).toBeUndefined();
    });

    it('frontmatter sem campos opcionais preenche com defaults', () => {
      const record = {
        frontmatter: { id: 'T-002', status: 'done' as const },
      };
      const result = toSchedulable(record);
      expect(result.dependencies).toEqual([]);
      expect(result.blocks).toEqual([]);
      expect(result.targetAgent).toBeUndefined();
    });

    it('extrai capacity do body (haiku)', () => {
      const record = {
        frontmatter: { id: 'T-003', status: 'ready' as const },
        body: 'Capacidade-alvo: haiku',
      };
      expect(toSchedulable(record).capacity).toBe('haiku');
    });

    it('extrai capacity do body (sonnet)', () => {
      const record = {
        frontmatter: { id: 'T-004', status: 'ready' as const },
        body: 'Capacidade-alvo: sonnet',
      };
      expect(toSchedulable(record).capacity).toBe('sonnet');
    });

    it('extrai capacity do body (opus-spike)', () => {
      const record = {
        frontmatter: { id: 'T-005', status: 'ready' as const },
        body: 'Capacidade-alvo: opus-spike',
      };
      expect(toSchedulable(record).capacity).toBe('opus-spike');
    });

    it('capacity ausente no body → undefined', () => {
      const record = {
        frontmatter: { id: 'T-006', status: 'ready' as const },
        body: 'algum texto sem a linha de capacidade',
      };
      expect(toSchedulable(record).capacity).toBeUndefined();
    });

    it('body undefined → capacity undefined', () => {
      const record = {
        frontmatter: { id: 'T-007', status: 'ready' as const },
      };
      expect(toSchedulable(record).capacity).toBeUndefined();
    });

    it('linha Capacidade-alvo em meio ao corpo', () => {
      const record = {
        frontmatter: { id: 'T-008', status: 'ready' as const },
        body: '## 0. Ambiente\n\nCapacidade-alvo: sonnet\n\nOutra linha',
      };
      expect(toSchedulable(record).capacity).toBe('sonnet');
    });

    it('valor inválido na linha Capacidade-alvo → undefined', () => {
      const record = {
        frontmatter: { id: 'T-009', status: 'ready' as const },
        body: 'Capacidade-alvo: gpt-4',
      };
      expect(toSchedulable(record).capacity).toBeUndefined();
    });
  });
});
