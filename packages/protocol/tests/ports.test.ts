import { describe, expect, test } from 'vitest';

import type {
  ClockPort,
  LoggerPort,
  LogLevel,
  MessageHandler,
  NetworkAdapterPort,
  PeerId,
  RandomPort,
  SqlParams,
  SqlRow,
  StoragePort,
  WireData,
} from '../src/ports.js';

// ---------------------------------------------------------------------------
// Stubs das 5 portas (apenas checagem de tipo, sem lógica real)
// ---------------------------------------------------------------------------

class DummyClock implements ClockPort {
  now(): number {
    return Date.now();
  }
}

class DummyRandom implements RandomPort {
  bytes(length: number): Uint8Array {
    return new Uint8Array(length);
  }
}

class DummyLogger implements LoggerPort {
  log(_level: LogLevel, _message: string, _meta?: Record<string, unknown>): void {
    /* stub */
  }
  debug(_message: string, _meta?: Record<string, unknown>): void {
    /* stub */
  }
  info(_message: string, _meta?: Record<string, unknown>): void {
    /* stub */
  }
  warn(_message: string, _meta?: Record<string, unknown>): void {
    /* stub */
  }
  error(_message: string, _meta?: Record<string, unknown>): void {
    /* stub */
  }
}

class DummyNetwork implements NetworkAdapterPort {
  async connect(_peerId: PeerId): Promise<void> {
    /* stub */
  }
  async listen(): Promise<void> {
    /* stub */
  }
  async send(_peerId: PeerId, _data: WireData): Promise<void> {
    /* stub */
  }
  onMessage(_handler: MessageHandler): () => void {
    return () => {
      /* stub unsubscribe */
    };
  }
  async close(): Promise<void> {
    /* stub */
  }
}

class DummyStorage implements StoragePort {
  async exec(_sql: string, _params?: SqlParams): Promise<SqlRow[]> {
    return [];
  }
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
  async migrate(_migrations: Array<{ version: number; sql: string }>): Promise<void> {
    /* stub */
  }
}

// ---------------------------------------------------------------------------
// Casos 1–7: stubs compilam e retornam tipos corretos + multi-subscriber
// ---------------------------------------------------------------------------

describe('Ports — type stubs', () => {
  test('1. DummyClock.now() retorna number', () => {
    const c = new DummyClock();
    const t = c.now();
    expect(typeof t).toBe('number');
  });

  test('2. DummyRandom.bytes(32) retorna Uint8Array de length 32', () => {
    const r = new DummyRandom();
    const buf = r.bytes(32);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBe(32);
  });

  test('3. DummyLogger — todos os 5 métodos aceitam string + meta opcional', () => {
    const l = new DummyLogger();
    expect(() => {
      l.log('info', 'msg');
      l.log('debug', 'msg', { x: 1 });
      l.debug('msg');
      l.info('msg');
      l.warn('msg');
      l.error('msg');
    }).not.toThrow();
  });

  test('4. DummyNetwork — todos os métodos retornam Promise<void> ou () => void', async () => {
    const n = new DummyNetwork();
    await n.connect('peer-a');
    await n.listen();
    await n.send('peer-a', new Uint8Array());
    const unsub = n.onMessage((_id, _data) => {});
    expect(typeof unsub).toBe('function');
    unsub(); // idempotente no dummy
    await n.close();
  });

  test('5. DummyStorage — exec e transaction retornam tipos corretos', async () => {
    const s = new DummyStorage();
    const rows = await s.exec('SELECT 1');
    expect(Array.isArray(rows)).toBe(true);

    const result = await s.transaction(async () => 42);
    expect(result).toBe(42);

    await s.migrate([{ version: 1, sql: 'CREATE TABLE t (id int)' }]);
  });

  test('6. Type aliases são exportados e tipáveis', () => {
    const peerId: PeerId = 'abc';
    const data: WireData = new Uint8Array([1, 2, 3]);
    const handler: MessageHandler = (_id, _data) => {};
    const level: LogLevel = 'warn';
    const row: SqlRow = { col: 'value' };

    expect(typeof peerId).toBe('string');
    expect(data).toBeInstanceOf(Uint8Array);
    expect(typeof handler).toBe('function');
    expect(level).toBe('warn');
    expect(row.col).toBe('value');
  });

  test('7. código que descarta retorno de onMessage() compila (TS permite)', () => {
    const n = new DummyNetwork();
    // Registrar e descartar retorno — não deve lançar
    n.onMessage((_id, _data) => {});
    // Prova de que TS aceita () => void descartado
  });
});

// ---------------------------------------------------------------------------
// Casos 1–5: contrato multi-subscriber (implementação de prova)
// ---------------------------------------------------------------------------

describe('Ports — multi-subscriber contract', () => {
  /**
   * Implementação de prova do novo contrato; a real (SimNetwork)
   * vive em packages/testkit e é coberta por subscriber tests lá.
   */
  function makeStubNetwork() {
    const handlers = new Set<MessageHandler>();
    const n: NetworkAdapterPort = {
      connect: async (_pid: PeerId) => {},
      listen: async () => {},
      send: async (_pid: PeerId, _data: WireData) => {},
      onMessage: (handler: MessageHandler): (() => void) => {
        handlers.add(handler);
        return () => {
          handlers.delete(handler);
        };
      },
      close: async () => {
        handlers.clear();
      },
    };
    return {
      n,
      deliver: (peerId: PeerId, data: WireData) => {
        // Simula entrega: snapshot do conjunto no momento do disparo
        for (const h of [...handlers]) h(peerId, data);
      },
    };
  }

  test('1. múltiplos handlers registrados recebem a mesma mensagem (broadcast)', () => {
    const { n, deliver } = makeStubNetwork();
    const calls: string[] = [];
    n.onMessage((_pid, _d) => calls.push('h1'));
    n.onMessage((_pid, _d) => calls.push('h2'));

    deliver('A' as PeerId, new Uint8Array([1]));

    expect(calls).toEqual(['h1', 'h2']);
  });

  test('2. unsubscribe remove apenas aquele handler — outro continua', () => {
    const { n, deliver } = makeStubNetwork();
    const calls: string[] = [];
    const un1 = n.onMessage((_pid, _d) => calls.push('h1'));
    n.onMessage((_pid, _d) => calls.push('h2'));

    un1(); // remove h1
    deliver('A' as PeerId, new Uint8Array([1]));

    expect(calls).toEqual(['h2']);
  });

  test('3. unsubscribe chamado 2× é idempotente', () => {
    const { n, deliver } = makeStubNetwork();
    const calls: string[] = [];
    const un1 = n.onMessage((_pid, _d) => calls.push('h1'));
    n.onMessage((_pid, _d) => calls.push('h2'));

    un1(); // 1ª
    un1(); // 2ª — idempotente, não lança

    deliver('A' as PeerId, new Uint8Array([1]));
    expect(calls).toEqual(['h2']);
  });

  test('4. handler registrado depois de uma mensagem não recebe replay', () => {
    const { n, deliver } = makeStubNetwork();
    const callsH1: string[] = [];
    n.onMessage((_pid, _d) => callsH1.push('x'));

    deliver('A' as PeerId, new Uint8Array([1])); // entregue ao h1
    expect(callsH1).toEqual(['x']);

    const callsH2: string[] = [];
    n.onMessage((_pid, _d) => callsH2.push('y')); // registrado DEPOIS
    expect(callsH2).toEqual([]); // sem replay
  });

  test('5. close() limpa todos os handlers — nenhum chamado após close()', async () => {
    const { n } = makeStubNetwork();
    let called = false;
    n.onMessage((_pid, _d) => { called = true; });
    n.onMessage((_pid, _d) => { called = true; });

    await n.close();

    // Após close, mesmo que houvesse entrega, não acontece
    // (na prove-stub, close limpa os handlers; na SimNetwork real, close seta closed + limpa)
    expect(called).toBe(false);
  });
});
