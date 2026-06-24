import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import type { Server as HttpServer } from 'node:http';
import { createServer } from 'node:http';
import { mountHealthRoute, mountAdminRoutes, mountSeedRoute } from './admin.js';
import {
  initControlRelay,
  relayCommand,
  RelayNotFoundError,
  RelayTimeoutError,
} from './controlRelay.js';
import type { ClientRegistry } from './types.js';

export interface CreateAppOptions {
  adminToken: string;
}

export interface CreatedApp {
  app: Express;
  server: HttpServer;
  registry: ClientRegistry;
}

/**
 * Cria e configura o app Express + WebSocket relay.
 * NÃO chama listen — o caller (server.ts ou teste) controla o ciclo de vida.
 */
export function createApp(opts: CreateAppOptions): CreatedApp {
  const { adminToken } = opts;
  const app = express();
  app.use(cors());
  app.use(express.json());

  mountHealthRoute(app);
  mountAdminRoutes(app, adminToken);
  mountSeedRoute(app, adminToken);

  const server = createServer(app);
  const { registry } = initControlRelay(server, adminToken);

  // POST /control/relay/:clientId/execute
  app.post(
    '/control/relay/:clientId/execute',
    (req: Request, res: Response, next: NextFunction): void => {
      // Valida token de admin
      const header = req.header('authorization') ?? req.header('Authorization');
      const match = /^Bearer\s+(.+)$/.exec(header ?? '');
      if (!match || match[1] !== adminToken) {
        res.status(403).json({ error: 'forbidden', reason: 'invalid_token' });
        return;
      }
      next();
    },
    (req: Request, res: Response): void => {
      const clientId = req.params['clientId'] ?? '';
      const body = req.body as { cmd?: unknown; payload?: unknown } | undefined;
      const cmd = typeof body?.cmd === 'string' ? body.cmd : '';
      const payload = body?.payload;
      relayCommand({ clientId, cmd, payload, registry })
        .then((result) => {
          res.status(200).json(result);
        })
        .catch((err: unknown) => {
          if (err instanceof RelayNotFoundError) {
            res.status(404).json({ error: 'not_found', reason: 'client_not_in_registry' });
            return;
          }
          if (err instanceof RelayTimeoutError) {
            res.status(504).json({ error: 'timeout' });
            return;
          }
          throw err;
        });
    },
  );

  // GET /control/registry (somente NODE_ENV !== production) — endpoint de inspeção
  // para testes E2E identificarem o clientId. Não é parte do contrato público.
  app.get('/control/registry', (req: Request, res: Response): void => {
    if (process.env['NODE_ENV'] === 'production') {
      res.status(404).end();
      return;
    }
    const header = req.header('authorization') ?? req.header('Authorization');
    const match = /^Bearer\s+(.+)$/.exec(header ?? '');
    if (!match || match[1] !== adminToken) {
      res.status(403).end();
      return;
    }
    res.status(200).json({ clients: Array.from(registry.keys()) });
  });

  return { app, server, registry };
}
