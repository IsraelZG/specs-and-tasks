import { describe, it, expect } from 'vitest';
import { actionsFor, actionForTarget, COLUMNS, STATUS_LABEL } from './transitions';

describe('actionsFor', () => {
  it('oferece start a partir de draft/ready/rework', () => {
    expect(actionsFor('draft')).toContain('start');
    expect(actionsFor('ready')).toContain('start');
    expect(actionsFor('rework')).toContain('start');
  });

  it('oferece pause/finish a partir de in_progress', () => {
    const acts = actionsFor('in_progress');
    expect(acts).toContain('pause');
    expect(acts).toContain('finish');
    expect(acts).not.toContain('start');
  });

  it('oferece approve/request_changes a partir de review', () => {
    const acts = actionsFor('review');
    expect(acts).toEqual(expect.arrayContaining(['approve', 'request_changes']));
  });

  it('block está disponível em qualquer status (regra from: *)', () => {
    for (const status of COLUMNS) {
      expect(actionsFor(status)).toContain('block');
    }
  });

  it('unblock só a partir de blocked', () => {
    expect(actionsFor('blocked')).toContain('unblock');
    expect(actionsFor('ready')).not.toContain('unblock');
  });
});

describe('actionForTarget', () => {
  it('deriva start ao mover ready → in_progress', () => {
    expect(actionForTarget('ready', 'in_progress')).toBe('start');
  });

  it('deriva finish ao mover in_progress → review', () => {
    expect(actionForTarget('in_progress', 'review')).toBe('finish');
  });

  it('deriva approve ao mover review → done', () => {
    expect(actionForTarget('review', 'done')).toBe('approve');
  });

  it('deriva request_changes ao mover review → rework', () => {
    expect(actionForTarget('review', 'rework')).toBe('request_changes');
  });

  it('retorna null para a mesma coluna', () => {
    expect(actionForTarget('done', 'done')).toBeNull();
  });

  it('retorna null para um movimento inválido (draft → done)', () => {
    expect(actionForTarget('draft', 'done')).toBeNull();
  });
});

describe('metadados de UI', () => {
  it('COLUMNS tem um rótulo para cada status', () => {
    for (const col of COLUMNS) {
      expect(STATUS_LABEL[col]).toBeTruthy();
    }
  });
});
