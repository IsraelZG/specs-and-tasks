import { describe, test, expect, vi } from 'vitest';
import type { NetworkAdapterPort, MessageHandler, PeerId } from '@plataforma/protocol';
import { deriveDevicePeerId } from '@plataforma/protocol';
import { ed25519GenerateKeyPair } from '@plataforma/crypto';
import {
  initiateNoiseXX,
  respondNoiseXX,
  NoiseHandshakeError,
  NoiseXX,
  encryptWithAd,
  decryptWithAd,
  type Ed25519Keypair,
} from '../src/noiseHandshake.js';

/** Par de adapters in-memory point-to-point: `send` entrega ao par via microtask (entrega assíncrona).
 *  Opcional `tamper` corrompe 1 byte da n-ésima mensagem A→B (teste de adulteração). */
function makePair(tamperIndexAtoB = -1): [NetworkAdapterPort, NetworkAdapterPort] {
  let hA: MessageHandler | null = null;
  let hB: MessageHandler | null = null;
  const closeHandlersA = new Set<(peerId: PeerId, reason?: 'remote' | 'error' | 'local') => void>();
  const closeHandlersB = new Set<(peerId: PeerId, reason?: 'remote' | 'error' | 'local') => void>();
  const closedA = new Set<PeerId>();
  const closedB = new Set<PeerId>();
  let countAtoB = 0;
  const a: NetworkAdapterPort = {
    connect: () => Promise.resolve(),
    listen: () => Promise.resolve(),
    send: (_to: PeerId, data) => {
      const i = countAtoB++;
      const out = i === tamperIndexAtoB ? tamperByte(data) : data;
      queueMicrotask(() => hB?.('A', out));
      return Promise.resolve();
    },
    onMessage: (h) => {
      hA = h;
      return () => { hA = null; };
    },
    onClose: (h) => {
      closeHandlersA.add(h);
      return () => { closeHandlersA.delete(h); };
    },
    close: (peerId?: PeerId) => {
      if (peerId) closedA.add(peerId);
      for (const h of closeHandlersA) h(peerId ?? 'A', 'local');
      closeHandlersA.clear();
      return Promise.resolve();
    },
  };
  const b: NetworkAdapterPort = {
    connect: () => Promise.resolve(),
    listen: () => Promise.resolve(),
    send: (_to: PeerId, data) => {
      queueMicrotask(() => hA?.('B', data));
      return Promise.resolve();
    },
    onMessage: (h) => {
      hB = h;
      return () => { hB = null; };
    },
    onClose: (h) => {
      closeHandlersB.add(h);
      return () => { closeHandlersB.delete(h); };
    },
    close: (peerId?: PeerId) => {
      if (peerId) closedB.add(peerId);
      for (const h of closeHandlersB) h(peerId ?? 'B', 'local');
      closeHandlersB.clear();
      return Promise.resolve();
    },
  };
  return [a, b];
}
function tamperByte(d: Uint8Array): Uint8Array {
  const c = new Uint8Array(d);
  if (c.length > 0) c[c.length - 1] = (c[c.length - 1] ?? 0) ^ 0xff;
  return c;
}
/** Adapter que nunca entrega (para teste de timeout). */
function deadAdapter(): NetworkAdapterPort {
  return {
    connect: () => Promise.resolve(),
    listen: () => Promise.resolve(),
    send: () => Promise.resolve(),
    onMessage: () => () => {},
    onClose: () => () => {},
    close: () => Promise.resolve(),
  };
}

async function keypair(): Promise<Ed25519Keypair> {
  const kp = await ed25519GenerateKeyPair();
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

describe('Noise_XX handshake (T-202)', () => {
  test('1+8: handshake feliz sobre adapter in-memory → DevicePeerIds corretos, epochMismatch false', async () => {
    const [a, b] = makePair();
    const alice = await keypair();
    const bob = await keypair();
    const [rInit, rResp] = await Promise.all([
      initiateNoiseXX(a, alice, 7),
      respondNoiseXX(b, bob, 7),
    ]);
    expect(rInit.remoteDeviceId).toBe(deriveDevicePeerId(bob.publicKey));
    expect(rResp.remoteDeviceId).toBe(deriveDevicePeerId(alice.publicKey));
    expect(rInit.epochMismatch).toBe(false);
    expect(rResp.epochMismatch).toBe(false);
  });

  test('2+3: canais pós-handshake — mensagem ida e volta', async () => {
    const [a, b] = makePair();
    const ka = await keypair();
    const kb = await keypair();
    const [rInit, rResp] = await Promise.all([initiateNoiseXX(a, ka, 1), respondNoiseXX(b, kb, 1)]);
    const respIt = rResp.receive()[Symbol.asyncIterator]();
    await rInit.send(Uint8Array.of(1, 2, 3));
    expect((await respIt.next()).value).toEqual(Uint8Array.of(1, 2, 3));

    const initIt = rInit.receive()[Symbol.asyncIterator]();
    await rResp.send(Uint8Array.of(9, 8, 7));
    expect((await initIt.next()).value).toEqual(Uint8Array.of(9, 8, 7));
  });

  test('7: divergência de época → epochMismatch true, conexão mantida', async () => {
    const [a, b] = makePair();
    const ka = await keypair();
    const kb = await keypair();
    const [rInit, rResp] = await Promise.all([initiateNoiseXX(a, ka, 5), respondNoiseXX(b, kb, 3)]);
    expect(rInit.epochMismatch).toBe(true);
    expect(rInit.remoteEpochIndex).toBe(3);
    expect(rResp.epochMismatch).toBe(true);
    expect(rResp.remoteEpochIndex).toBe(5);
  });

  test('4: chave remota incorreta (expectedRemoteDevicePub não bate) → NoiseHandshakeError reason=wrong_key', async () => {
    const [a, b] = makePair();
    const ka = await keypair();
    const kb = await keypair();
    const wrongPub = (await keypair()).publicKey; // chave de um terceiro — não é kb
    let caughtReason: string | undefined;
    // respondNoiseXX usa timeout curto (300ms): iniciador nunca envia msg3 (rejeitou com wrong_key).
    await Promise.allSettled([
      initiateNoiseXX(a, ka, 1, 5_000, wrongPub).catch((e: unknown) => {
        if (e instanceof NoiseHandshakeError) caughtReason = e.reason;
      }),
      respondNoiseXX(b, kb, 1, 300),
    ]);
    expect(caughtReason).toBe('wrong_key');
  }, 6_000);

  test('5: mensagem adulterada no trânsito → NoiseHandshakeError', async () => {
    // corrompe a 2ª mensagem A→B (msg3: `s, se`) → o respondedor falha ao decifrar
    const [a, b] = makePair(1);
    const ka = await keypair();
    const kb = await keypair();
    const results = await Promise.allSettled([
      initiateNoiseXX(a, ka, 1, 300),
      respondNoiseXX(b, kb, 1, 300),
    ]);
    const rejected = results.find((r) => r.status === 'rejected');
    expect(rejected).toBeDefined();
    if (rejected && rejected.status === 'rejected') {
      expect(rejected.reason).toBeInstanceOf(NoiseHandshakeError);
    }
  });

  test('6: timeout — respondedor nunca responde → NoiseHandshakeError reason=timeout', async () => {
    await expect(initiateNoiseXX(deadAdapter(), await keypair(), 1, 80)).rejects.toMatchObject({
      reason: 'timeout',
    });
  });

  test('9: test vector oficial Noise_XX_25519_ChaChaPoly_SHA256 (rweather/noise-c)', async () => {
    const hb = (h: string): Uint8Array => {
      const out = new Uint8Array(h.length / 2);
      for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
      return out;
    };
    const toHex = (b: Uint8Array): string =>
      Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    const empty = new Uint8Array(0);
    const V = {
      prologue: '50726f6c6f677565313233',
      initStatic: 'e61ef9919cde45dd5f82166404bd08e38bceb5dfdfded0a34c8df7ed542214d1',
      initEph: '893e28b9dc6ca8d611ab664754b8ceb7bac5117349a4439a6b0569da977c464a',
      respStatic: '4a3acbfdb163dec651dfa3194dece676d437029c62a408b4c5ea9114246e4893',
      respEph: 'bbdb4cdbd309f1a1f2e1456967fe288cadd6f712d65dc7b7793d5e63da6b375b',
      hh: '852a28d2146785c54bd8334f4e460c80d7fe4fd0cc5bc0abef2a24a3c4d44d5f',
      msgs: [
        { p: '4c756477696720766f6e204d69736573', ct: 'ca35def5ae56cec33dc2036731ab14896bc4c75dbb07a61f879f8e3afa4c79444c756477696720766f6e204d69736573' },
        { p: '4d757272617920526f746862617264', ct: '95ebc60d2b1fa672c1f46a8aa265ef51bfe38e7ccb39ec5be34069f14480884381cbad1f276e038c48378ffce2b65285e08d6b68aaa3629a5a8639392490e5b94a6d8798832d5372f220f161d9c2df035528f8982ffe09be9b5c412f8a0db5d21351f20af1370d0bf8ef1a8c59a30e' },
        { p: '462e20412e20486179656b', ct: 'c7195ffacac1307ff99046f219750fc47693e23c3cb08b89c2af808b444850a8589981dfbd651e6ff4724a781cc2aa6158c9fea0d4ec82a286427484c5b8c8123a7a6002b1de9f9775fc97' },
        { p: '4361726c204d656e676572', ct: '96763ed773f8e47bb3712f0e29b3060ffc956ffc146cee53d5e1df' },
        { p: '4a65616e2d426170746973746520536179', ct: '3e40f15f6f3a46ae446b253bf8b1d9ffb6ed9b174d272328ff91a7e2e5c79c07f5' },
        { p: '457567656e2042f6686d20766f6e2042617765726b', ct: 'eb3f3515110702e047a6c9da4478b6ead94873c11c0f2d710ddb3f09fce024b3a58502ae3f' },
      ],
    };
    const prologue = hb(V.prologue);
    const init = new NoiseXX(hb(V.initStatic), hb(V.initEph), prologue);
    const resp = new NoiseXX(hb(V.respStatic), hb(V.respEph), prologue);

    // msg0 init->resp (e)
    expect(toHex(init.writeA(hb(V.msgs[0]!.p)))).toBe(V.msgs[0]!.ct);
    expect(toHex(resp.readA(hb(V.msgs[0]!.ct)))).toBe(V.msgs[0]!.p);
    // msg1 resp->init (e, ee, s, es)
    expect(toHex(await resp.writeB(() => Promise.resolve(hb(V.msgs[1]!.p))))).toBe(V.msgs[1]!.ct);
    expect(toHex(init.readB(hb(V.msgs[1]!.ct)).payload)).toBe(V.msgs[1]!.p);
    // msg2 init->resp (s, se)
    expect(toHex(await init.writeC(() => Promise.resolve(hb(V.msgs[2]!.p))))).toBe(V.msgs[2]!.ct);
    expect(toHex(resp.readC(hb(V.msgs[2]!.ct)).payload)).toBe(V.msgs[2]!.p);
    // handshake hash byte-a-byte (prova de conformidade do core)
    expect(toHex(init.handshakeHash)).toBe(V.hh);
    expect(toHex(resp.handshakeHash)).toBe(V.hh);
    // transporte pós-split: direções + avanço de nonce
    const [initSend, initRecv] = init.split();
    const [respRecv, respSend] = resp.split();
    expect(toHex(encryptWithAd(respSend, empty, hb(V.msgs[3]!.p)))).toBe(V.msgs[3]!.ct); // resp->init n=0
    expect(toHex(decryptWithAd(initRecv, empty, hb(V.msgs[3]!.ct)))).toBe(V.msgs[3]!.p);
    expect(toHex(encryptWithAd(initSend, empty, hb(V.msgs[4]!.p)))).toBe(V.msgs[4]!.ct); // init->resp n=0
    expect(toHex(decryptWithAd(respRecv, empty, hb(V.msgs[4]!.ct)))).toBe(V.msgs[4]!.p);
    expect(toHex(encryptWithAd(respSend, empty, hb(V.msgs[5]!.p)))).toBe(V.msgs[5]!.ct); // resp->init n=1
  });

  test('13: receive() termina quando onClose dispara (queda remota)', async () => {
    const [a, b] = makePair();
    const ka = await keypair();
    const kb = await keypair();
    const [rInit, rResp] = await Promise.all([
      initiateNoiseXX(a, ka, 1),
      respondNoiseXX(b, kb, 1),
    ]);
    // Fecha o adapter do iniciador para o peer remoto (simula queda do respondedor)
    await a.close('B');
    // O receive() do iniciador deve terminar
    const messages: Uint8Array[] = [];
    for await (const m of rInit.receive()) {
      messages.push(m);
    }
    expect(messages).toEqual([]);
  });

  test('14: receive({ signal }) termina quando caller aborta', async () => {
    const [a, b] = makePair();
    const ka = await keypair();
    const kb = await keypair();
    const [rInit] = await Promise.all([
      initiateNoiseXX(a, ka, 1),
      respondNoiseXX(b, kb, 1),
    ]);
    const ac = new AbortController();
    const messages: Uint8Array[] = [];
    const iterating = (async () => {
      for await (const m of rInit.receive({ signal: ac.signal })) {
        messages.push(m);
      }
    })();
    // Aborta imediatamente — o receive deve terminar
    ac.abort();
    await iterating;
    expect(messages).toEqual([]);
  });

  test('15: decryptWithAd loga console.error antes de lançar invalid_signature', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cs: CipherState = { k: new Uint8Array(32), n: 0 };
    // ciphertext aleatório (não foi cifrado com a chave correta → tag mismatch)
    const badCiphertext = new Uint8Array(32);
    expect(() => decryptWithAd(cs, new Uint8Array(0), badCiphertext)).toThrow(NoiseHandshakeError);
    expect(spy).toHaveBeenCalledWith(
      '[noiseHandshake] AEAD decrypt failed:',
      expect.any(Error),
    );
    spy.mockRestore();
  });

  test('16: makePair onClose dispara reason local quando close() chamado', async () => {
    const [a] = makePair();
    let closedPeer: string | undefined;
    let closedReason: string | undefined;
    a.onClose((peerId, reason) => {
      closedPeer = peerId;
      closedReason = reason;
    });
    await a.close('test-peer');
    expect(closedPeer).toBe('test-peer');
    expect(closedReason).toBe('local');
  });
});
