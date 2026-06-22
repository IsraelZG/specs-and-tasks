import { describe, it, expect } from 'vitest';
import { VirtualClock } from '@plataforma/testkit';
import { KeyVault } from '../src/keyVault';

function makeVault(initialMs = 0): { vault: KeyVault; clock: VirtualClock } {
  const clock = new VirtualClock(initialMs);
  return { vault: new KeyVault(clock), clock };
}

describe('KeyVault', () => {
  it('1: store + requestKey retorna a chave armazenada', () => {
    const { vault } = makeVault();
    const key = new Uint8Array([1, 2, 3]);
    vault.store('scope-a', key);
    const result = vault.requestKey('scope-a');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.key).toEqual(key);
  });

  it('2: requestKey para scope inexistente → not_found', () => {
    const { vault } = makeVault();
    const result = vault.requestKey('inexistente');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not_found');
  });

  it('3: expiração por TTL — chave expira após o tempo configurado', () => {
    const { vault, clock } = makeVault();
    vault.store('scope-timed', new Uint8Array([9]), 1000);

    // antes de expirar
    clock.advance(999);
    expect(vault.requestKey('scope-timed').ok).toBe(true);

    // após expirar
    clock.advance(2); // +2ms = 1001ms total
    const result = vault.requestKey('scope-timed');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('4: purgeExpired remove entradas expiradas e retorna contagem', () => {
    const { vault, clock } = makeVault();
    vault.store('a', new Uint8Array([1]), 100);
    vault.store('b', new Uint8Array([2]), 100);
    vault.store('c', new Uint8Array([3]), 500);

    expect(vault.size()).toBe(3);

    clock.advance(101); // a e b expiram, c não
    const removed = vault.purgeExpired();
    expect(removed).toBe(2);
    expect(vault.size()).toBe(1);
  });

  it('5: TTL default = 4h', () => {
    const { vault, clock } = makeVault();
    const fourHoursMs = 4 * 60 * 60 * 1000;
    vault.store('scope-4h', new Uint8Array([42]));

    // 4h - 1ms: ainda ativa
    clock.advance(fourHoursMs - 1);
    expect(vault.requestKey('scope-4h').ok).toBe(true);

    // +1ms: expira
    clock.advance(1);
    const result = vault.requestKey('scope-4h');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('6: requestEpochKey com chave ativa → ok', () => {
    const { vault, clock } = makeVault();
    vault.store('epoch-scope', new Uint8Array([7, 8, 9]));
    const result = vault.requestEpochKey('epoch-scope', {
      ucan: 'fake-ucan',
      delegatedTo: '0xabc',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.key).toEqual(new Uint8Array([7, 8, 9]));
  });

  it('7: requestEpochKey com chave expirada → expired', () => {
    const { vault, clock } = makeVault();
    vault.store('epoch-exp', new Uint8Array([1]), 10);
    clock.advance(11);
    const result = vault.requestEpochKey('epoch-exp', {
      ucan: 'fake',
      delegatedTo: '0xabc',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('8: requestEpochKey para scope inexistente → not_found', () => {
    const { vault } = makeVault();
    const result = vault.requestEpochKey('ghost', {
      ucan: 'fake',
      delegatedTo: '0xabc',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not_found');
  });

  it('9: requestEpochKey com proof vazia → denied', () => {
    const { vault } = makeVault();
    vault.store('s', new Uint8Array([1]));
    const result = vault.requestEpochKey('s', { ucan: '', delegatedTo: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('denied');
  });

  it('10: não-vazamento por referência — modificar original não afeta vault', () => {
    const { vault } = makeVault();
    const original = new Uint8Array([10, 20, 30]);
    vault.store('no-leak', original);

    // modifica o array original
    original[0] = 99;

    const result = vault.requestKey('no-leak');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.key).toEqual(new Uint8Array([10, 20, 30]));
  });

  it('11: vetor adversarial 7 — chave expirada não vaza', () => {
    const { vault, clock } = makeVault();
    vault.store('adv', new Uint8Array([1, 2]), 1);
    clock.advance(2);

    // requestKey não deve retornar chave expirada
    const r1 = vault.requestKey('adv');
    expect(r1.ok).toBe(false);

    // requestEpochKey também não
    const r2 = vault.requestEpochKey('adv', { ucan: 'x', delegatedTo: 'y' });
    expect(r2.ok).toBe(false);

    // após purgeExpired, entrada é removida
    vault.purgeExpired();
    expect(vault.size()).toBe(0);
  });
});
