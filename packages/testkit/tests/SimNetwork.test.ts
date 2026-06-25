import { describe, it, expect, vi } from 'vitest';
import { SimNetwork } from '../src/SimNetwork';
import { VirtualClock } from '../src/clock';
import type { NetworkAdapterPort, PeerId, WireData } from '@plataforma/protocol';

describe('SimNetwork', () => {
  // Caso 1: createAdapter retorna objeto que implementa NetworkAdapterPort
  it('1. createAdapter retorna objeto com os 5 métodos de NetworkAdapterPort', () => {
    const net = new SimNetwork();
    const adapter = net.createAdapter('A' as PeerId);
    expect(adapter).toBeDefined();
    expect(typeof adapter.connect).toBe('function');
    expect(typeof adapter.listen).toBe('function');
    expect(typeof adapter.send).toBe('function');
    expect(typeof adapter.onMessage).toBe('function');
    expect(typeof adapter.close).toBe('function');
  });

  // Caso 2: 2 peers — A envia send('B', data) → B recebe via onMessage
  it('2. A envia para B — B recebe o mesmo data com peerId=A', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const onBReceived = vi.fn();
    b.onMessage(onBReceived);

    const data = new Uint8Array([1, 2, 3]);
    await a.send('B' as PeerId, data);

    // Aguarda microtask
    await vi.waitFor(() => {
      expect(onBReceived).toHaveBeenCalledTimes(1);
      expect(onBReceived).toHaveBeenCalledWith('A' as PeerId, data);
    });
  });

  // Caso 3: 3 peers em cadeia A→B, B→C, C→A
  it('3. 3 peers em cadeia — cada um recebe exatamente 1 mensagem', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);
    const c = net.createAdapter('C' as PeerId);

    const onA = vi.fn();
    const onB = vi.fn();
    const onC = vi.fn();
    a.onMessage(onA);
    b.onMessage(onB);
    c.onMessage(onC);

    await a.send('B' as PeerId, new Uint8Array([1]));
    await b.send('C' as PeerId, new Uint8Array([2]));
    await c.send('A' as PeerId, new Uint8Array([3]));

    await vi.waitFor(() => {
      expect(onA).toHaveBeenCalledTimes(1);
      expect(onB).toHaveBeenCalledTimes(1);
      expect(onC).toHaveBeenCalledTimes(1);
    });

    expect(onB).toHaveBeenCalledWith('A' as PeerId, new Uint8Array([1]));
    expect(onC).toHaveBeenCalledWith('B' as PeerId, new Uint8Array([2]));
    expect(onA).toHaveBeenCalledWith('C' as PeerId, new Uint8Array([3]));
  });

  // Caso 4: partition(['A'], ['B']) — A→B descartado, A→A funciona
  it('4. partition isola grupos — A→B descartado, A→A funciona', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);

    // Precisamos de um peer B para testar o bloqueio
    const b = net.createAdapter('B' as PeerId);

    net.partition(['A' as PeerId], ['B' as PeerId]);

    const onBReceived = vi.fn();
    b.onMessage(onBReceived);

    // Self-send funciona
    const onAReceived = vi.fn();
    a.onMessage(onAReceived);

    await a.send('B' as PeerId, new Uint8Array([42]));

    // Pequena espera para garantir que microtask rodou
    await new Promise(r => setTimeout(r, 10));

    expect(onBReceived).toHaveBeenCalledTimes(0);

    // Self-send funciona
    await a.send('A' as PeerId, new Uint8Array([99]));
    await vi.waitFor(() => {
      expect(onAReceived).toHaveBeenCalledTimes(1);
    });
  });

  // Caso 5: partition(['A','B'], ['C']) — A→B funciona, A→C descartado, C→B descartado
  it('5. grupos múltiplos — intra-grupo passa, inter-grupo bloqueado', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);
    const c = net.createAdapter('C' as PeerId);

    net.partition(['A' as PeerId, 'B' as PeerId], ['C' as PeerId]);

    const onA = vi.fn();
    const onB = vi.fn();
    const onC = vi.fn();
    a.onMessage(onA);
    b.onMessage(onB);
    c.onMessage(onC);

    await a.send('B' as PeerId, new Uint8Array([1])); // intra-grupo passa
    await a.send('C' as PeerId, new Uint8Array([2])); // inter-grupo bloqueado
    await c.send('B' as PeerId, new Uint8Array([3])); // inter-grupo bloqueado

    await vi.waitFor(() => {
      expect(onB).toHaveBeenCalledTimes(1); // só A→B passou
    });
    expect(onC).toHaveBeenCalledTimes(0);
    expect(onA).toHaveBeenCalledTimes(0);
  });

  // Caso 6: heal() restaura conectividade
  it('6. heal() restaura conectividade total', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    net.partition(['A' as PeerId], ['B' as PeerId]);
    net.heal();

    const onB = vi.fn();
    b.onMessage(onB);

    await a.send('B' as PeerId, new Uint8Array([1]));
    await vi.waitFor(() => {
      expect(onB).toHaveBeenCalledTimes(1);
    });
  });

  // Caso 7: close() — send para peer fechado é no-op
  it('7. close() — send para peer fechado é no-op silencioso', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const onB = vi.fn();
    b.onMessage(onB);

    await b.close();
    await a.send('B' as PeerId, new Uint8Array([1]));

    await new Promise(r => setTimeout(r, 10));
    expect(onB).toHaveBeenCalledTimes(0);
  });

  // Caso 8: VirtualClock integrado — send agenda via clock.setTimeout
  it('8. com VirtualClock — send agenda via clock.setTimeout, advance(1) dispara', () => {
    const clock = new VirtualClock();
    const net = new SimNetwork(clock);
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const onB = vi.fn();
    b.onMessage(onB);

    a.send('B' as PeerId, new Uint8Array([1]));

    // Ainda não disparou (timer agendado para fireAt=0)
    expect(onB).toHaveBeenCalledTimes(0);

    // advance(1) processa timers com fireAt <= now + 1
    clock.advance(1);

    expect(onB).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledWith('A' as PeerId, new Uint8Array([1]));
  });

  // Caso 9 (regressão M1 / sonda S1): trocar onMessage entre send e entrega → multi-subscriber swap por unsubscribe
  it('9. onMessage trocado entre send e entrega → handler removido não recebe, novo recebe', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const oldHandler = vi.fn();
    const newHandler = vi.fn();
    const un = b.onMessage(oldHandler);

    const sendPromise = a.send('B' as PeerId, new Uint8Array([1]));
    un(); // remove oldHandler
    b.onMessage(newHandler);
    await sendPromise;

    await vi.waitFor(() => {
      expect(newHandler).toHaveBeenCalledTimes(1);
    });
    expect(oldHandler).toHaveBeenCalledTimes(0);
  });

  // Caso 10 (regressão M2 / sonda S2): close() entre send e entrega cancela a entrega in-flight
  it('10. close() entre send e entrega cancela a entrega in-flight', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const onB = vi.fn();
    b.onMessage(onB);

    // NÃO dar await no send antes do close: o send agenda a entrega (microtask); o close
    // acontece de forma síncrona ANTES da microtask rodar — essa é a janela do M2.
    const sendPromise = a.send('B' as PeerId, new Uint8Array([1]));
    await b.close();
    await sendPromise;

    await new Promise(r => setTimeout(r, 10));
    expect(onB).toHaveBeenCalledTimes(0);
  });

  // Caso 11 (semântica de partição = snapshot do send): partition() após o send não afeta msg em trânsito
  it('11. partition() entre send e entrega NÃO afeta mensagem já agendada (snapshot do send)', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    const b = net.createAdapter('B' as PeerId);

    const onB = vi.fn();
    b.onMessage(onB);

    // sem partição no momento do send
    const sendPromise = a.send('B' as PeerId, new Uint8Array([1]));
    // particiona DEPOIS do send, antes da entrega — não deve afetar a msg já no fio
    net.partition(['A' as PeerId], ['B' as PeerId]);
    await sendPromise;

    await vi.waitFor(() => {
      expect(onB).toHaveBeenCalledTimes(1);
    });
  });

  // Caso 12 (não-membro passa): partição só bloqueia quando origem E destino estão em grupos diferentes
  it('12. peer não-membro de nenhum grupo não é bloqueado pela partição', async () => {
    const net = new SimNetwork();
    const a = net.createAdapter('A' as PeerId);
    net.createAdapter('B' as PeerId);
    const c = net.createAdapter('C' as PeerId);

    net.partition(['A' as PeerId], ['B' as PeerId]); // C fora de qualquer grupo

    const onC = vi.fn();
    c.onMessage(onC);

    await a.send('C' as PeerId, new Uint8Array([7]));
    await vi.waitFor(() => {
      expect(onC).toHaveBeenCalledTimes(1);
    });
  });
});
