import { randomUUID } from 'node:crypto';
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { ClientRegistry } from './types.js';

const PATH = '/control';

/** Extrai bearer token do header Authorization. Retorna null se ausente/mal formado. */
function extractBearer(req: IncomingMessage): string | null {
  const header = req.headers['authorization'];
  if (!header || Array.isArray(header)) return null;
  const match = /^Bearer\s+(.+)$/.exec(header);
  return match?.[1] ?? null;
}

/**
 * Inicializa o WebSocket server no caminho `/control`.
 * - Aceita qualquer Bearer non-empty no M0 (stub).
 * - Gera clientId (UUID) por conexão.
 * - Remove do registry em close.
 * Retorna o registry para uso em `relayCommand`.
 */
export function initControlRelay(
  httpServer: HttpServer,
  // adminToken reservado para hardening futuro (validar session token contra segredo)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _adminToken: string,
): { registry: ClientRegistry } {
  const registry: ClientRegistry = new Map();

  const wss = new WebSocketServer({ server: httpServer, path: PATH });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const token = extractBearer(req);
    if (!token || token.length === 0) {
      ws.close(1008, 'missing_session_token');
      return;
    }

    const clientId = randomUUID();
    registry.set(clientId, ws);

    ws.on('close', () => {
      registry.delete(clientId);
    });
  });

  return { registry };
}

/**
 * Envia comando via WebSocket para o clientId, aguarda resposta com mesmo corr_id.
 * Retorna 504 (lança RelayTimeoutError) se timeoutMs for atingido sem resposta.
 */
export class RelayTimeoutError extends Error {
  constructor() {
    super('relay timeout');
    this.name = 'RelayTimeoutError';
  }
}

export class RelayNotFoundError extends Error {
  constructor() {
    super('relay client not found');
    this.name = 'RelayNotFoundError';
  }
}

export async function relayCommand(opts: {
  clientId: string;
  cmd: string;
  payload: unknown;
  registry: ClientRegistry;
  timeoutMs?: number;
}): Promise<{ corr_id: string; result: unknown }> {
  const { clientId, cmd, payload, registry } = opts;
  const timeoutMs = opts.timeoutMs ?? 5000;

  const ws = registry.get(clientId);
  if (!ws) {
    throw new RelayNotFoundError();
  }

  const corrId = randomUUID();
  const message = JSON.stringify({ corr_id: corrId, cmd, payload });

  return new Promise<{ corr_id: string; result: unknown }>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new RelayTimeoutError());
    }, timeoutMs);

    const onMessage = (data: unknown): void => {
      try {
        const parsed = JSON.parse((data as { toString(): string }).toString()) as {
          corr_id?: string;
          result?: unknown;
        };
        if (parsed.corr_id === corrId) {
          clearTimeout(timer);
          ws.off('message', onMessage);
          resolve({ corr_id: corrId, result: parsed.result });
        }
      } catch {
        // ignora mensagens que não parseiam
      }
    };

    ws.on('message', onMessage);
    ws.send(message);
  });
}
