import type { Request, Response, NextFunction } from 'express';
import type { Express } from 'express';

function isAuthorized(req: Request, adminToken: string): boolean {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header) return false;
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) return false;
  return match[1] === adminToken;
}

function isNonProduction(): boolean {
  return process.env['NODE_ENV'] !== 'production';
}

function requireAdmin(adminToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isAuthorized(req, adminToken)) {
      res.status(403).json({ error: 'forbidden', reason: 'invalid_token' });
      return;
    }
    if (!isNonProduction()) {
      res.status(403).json({ error: 'forbidden', reason: 'production_env' });
      return;
    }
    next();
  };
}

/**
 * GET /health: retorna 200 { ok: true }.
 * Sem auth (kubelet liveness probe).
 */
export function mountHealthRoute(app: Express): void {
  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });
}

/**
 * POST /admin/reset: trunca SQLite (stub M0), limpa blobs, reinicia SwarmRegistry (stub).
 * - 403 sem Authorization Bearer <adminToken>.
 * - 403 em NODE_ENV=production.
 * - 200 { ok: true } em sucesso (stub M0).
 */
export function mountAdminRoutes(app: Express, adminToken: string): void {
  app.post('/admin/reset', requireAdmin(adminToken), (_req, res) => {
    console.log('[reset] stub M0');
    res.status(200).json({ ok: true });
  });
}

/**
 * POST /admin/seed/:id: aplica seed com o identificador informado (stub M0).
 * - 403 sem Authorization Bearer <adminToken>.
 * - 403 em NODE_ENV=production.
 * - 200 { ok: true, seed: id } em sucesso.
 */
export function mountSeedRoute(app: Express, adminToken: string): void {
  app.post('/admin/seed/:id', requireAdmin(adminToken), (req, res) => {
    const id = req.params['id'];
    console.log('[seed] stub M0:', id);
    res.status(200).json({ ok: true, seed: id });
  });
}
