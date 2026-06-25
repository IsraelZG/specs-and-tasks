import { describe, it, expect, vi } from 'vitest';
import { SimNetwork } from '../src/SimNetwork';
import type { PeerId } from '@plataforma/protocol';

describe('SimNetwork multi-subscriber', () => {
  // Caso 8: broadcast — dois handlers recebem a mesma mensagem
  it('8. dois handlers registrados recebem a mesma mensagem (broadcast real)', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const h1 = vi.fn();
    const h2 = vi.fn();
    b.onMessage(h1);
    b.onMessage(h2);

    await a.send('B' as PeerId, new Uint8Array([1]));

    await vi.waitFor(() => {
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });

  // Caso 9: unsubscribe remove apenas aquele handler
  it('9. unsubscribe() remove apenas aquele handler — outro continua', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const h1 = vi.fn();
    const h2 = vi.fn();
    const un1 = b.onMessage(h1);
    b.onMessage(h2);

    un1(); // remove h1

    await a.send('B' as PeerId, new Uint8Array([1]));

    await vi.waitFor(() => {
      expect(h2).toHaveBeenCalledTimes(1);
    });
    expect(h1).toHaveBeenCalledTimes(0);
  });

  // Caso 10: close limpa todos os handlers
  it('10. close() limpa todos os handlers — nenhum recebe após close()', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const h1 = vi.fn();
    const h2 = vi.fn();
    b.onMessage(h1);
    b.onMessage(h2);

    const sendPromise = a.send('B' as PeerId, new Uint8Array([1]));
    await b.close();
    await sendPromise;

    await new Promise(r => setTimeout(r, 10));
    expect(h1).toHaveBeenCalledTimes(0);
    expect(h2).toHaveBeenCalledTimes(0);
  });

  // Caso 11: timing multi-subscriber (M1) — snapshot na entrega
  it('11. timing multi-subscriber — handlers lidos no momento da entrega (snapshot)', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const h1 = vi.fn();
    const h2 = vi.fn();
    const un = b.onMessage(h1);

    const sendPromise = a.send('B' as PeerId, new Uint8Array([1]));
    un(); // remove h1 antes da entrega
    b.onMessage(h2); // adiciona h2

    await sendPromise;

    await vi.waitFor(() => {
      expect(h2).toHaveBeenCalledTimes(1);
    });
    expect(h1).toHaveBeenCalledTimes(0);
  });
});
