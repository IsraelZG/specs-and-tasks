import type { NetworkAdapterPort, PeerId, WireData, MessageHandler } from '@plataforma/protocol';
import { VirtualClock } from './clock';

interface InternalAdapter {
  peerId: PeerId;
  handlers: Set<MessageHandler>;
  closed: boolean;
}

/**
 * Hub de rede simulada in-memory para N peers.
 * Conecta múltiplos adaptadores dentro do mesmo processo Node.js para testes de integração.
 *
 * @remarks
 * - Entrega confiável limitada apenas por partições manuais.
 * - Sem clock: entrega assíncrona via microtask (Promise.resolve().then(...)).
 * - Com clock: entrega via clock.setTimeout(callback, 0) — latência zero fixa.
 * - NÃO implementa degradação (perda, jitter, NAT) — escopo de T-006.
 */
export class SimNetwork {
  private readonly adapters = new Map<string, InternalAdapter>();
  private readonly peerToGroup = new Map<string, number>();
  private readonly groups: PeerId[][] = [];
  private readonly clock: VirtualClock | null;

  constructor(clock?: VirtualClock) {
    this.clock = clock ?? null;
  }

  /**
   * Cria um adapter que implementa NetworkAdapterPort para o peer informado.
   */
  createAdapter(peerId: PeerId): NetworkAdapterPort {
    if (this.adapters.has(peerId)) {
      throw new Error(`Adapter already exists for peer: ${peerId}`);
    }

    const internal: InternalAdapter = {
      peerId,
      handlers: new Set(),
      closed: false,
    };

    this.adapters.set(peerId, internal);

    const adapter: NetworkAdapterPort = {
      // connect é no-op em v1. Assinatura sem parâmetro: TS aceita impl. com menos
      // parâmetros que o tipo NetworkAdapterPort.connect, e declarar `_to` dispararia
      // @typescript-eslint/no-unused-vars (o eslint do projeto não ignora prefixo `_`).
      connect: async () => {
        // no-op em v1
      },

      listen: async () => {
        // no-op: adapters são automaticamente registrados ao serem criados
      },

      send: (to: PeerId, data: WireData) => {
        this.deliver(peerId, to, data);
        return Promise.resolve();
      },

      onMessage: (handler: MessageHandler) => {
        internal.handlers.add(handler);
        return () => {
          internal.handlers.delete(handler);
        };
      },

      close: () => {
        internal.closed = true;
        internal.handlers.clear();
        this.adapters.delete(peerId);
        return Promise.resolve();
      },
    };

    return adapter;
  }

  /**
   * Particiona a rede: mensagens que cruzam fronteiras de grupos são descartadas.
   *
   * @remarks
   * - Grupos sobrepostos: se um peer aparecer em mais de um grupo, o ÚLTIMO grupo vence
   *   (sobrescreve o mapeamento anterior). Não há validação/throw — é responsabilidade do chamador (m3).
   * - Peers não declarados em nenhum grupo NÃO são bloqueados: a mensagem só é descartada quando
   *   AMBOS (origem e destino) pertencem a grupos diferentes; se qualquer um for não-membro, passa (m4).
   */
  partition(...groups: PeerId[][]): void {
    this.groups.length = 0;
    this.peerToGroup.clear();

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      for (const peerId of group) {
        this.peerToGroup.set(peerId, i);
      }
      this.groups.push(group);
    }
  }

  /**
   * Restaura conectividade total entre todos os peers.
   */
  heal(): void {
    this.groups.length = 0;
    this.peerToGroup.clear();
  }

  /**
   * Entrega dados do remetente ao destinatário, respeitando partições.
   */
  private deliver(from: PeerId, to: PeerId, data: WireData): void {
    const target = this.adapters.get(to);

    // Se destinatário não existe (nunca criado, ou já fechado e removido do hub) → no-op.
    // (close() remove do Map e seta `closed`; logo, no momento do send, um target não-nulo
    //  nunca está closed — a checagem de `closed` que importa é a do momento da ENTREGA, abaixo.)
    if (!target) return;

    // Verifica partição
    const fromGroup = this.peerToGroup.get(from);
    const toGroup = this.peerToGroup.get(to);

    // Se há partições ativas e os peers estão em grupos diferentes → descarta
    if (this.groups.length > 0) {
      if (fromGroup !== undefined && toGroup !== undefined && fromGroup !== toGroup) {
        return;
      }
    }

    // Agenda entrega. Handler e estado `closed` são lidos NO MOMENTO DA ENTREGA (não no send):
    //  - M1: permite trocar onMessage entre o send e a entrega — o handler vigente é usado.
    //  - M2: cancela entregas in-flight se o peer fechar antes do disparo.
    const deliverMsg = () => {
      if (target.closed) return; // M2: peer fechou após o send → cancela a entrega pendente
      // Snapshot do conjunto de handlers no momento da entrega (M1): permite
      // adicionar/remover handlers entre send e entrega — o snapshot captura
      // o estado vigente na hora do disparo.
      const handlers = [...target.handlers];
      for (const handler of handlers) {
        handler(from, data);
      }
    };

    if (this.clock) {
      this.clock.setTimeout(deliverMsg, 0);
    } else {
      void Promise.resolve().then(deliverMsg);
    }
  }
}
