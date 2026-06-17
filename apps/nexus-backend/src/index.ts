import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { TaskService } from './services/task.service.js';
import { TaskController } from './services/task.controller.js';
import { buildExport } from './services/export.service.js';
import { getCompressor } from './services/compressor.js';
import {
  ForbiddenRoleError,
  InvalidTransitionError,
  StatusDriftError,
  TaskNotFoundError,
  TaskStatus,
  ValidationError,
} from './services/task.types.js';

// Raiz do repositório (contém tasks/ e meta-tasks/). dist/index.js → ../../../ = raiz.
const ROOT_DIR = path.resolve(__dirname, '../../../');
const PORT = process.env.PORT || 3001;

function statusFromError(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof TaskNotFoundError) return 404;
  if (err instanceof ForbiddenRoleError) return 403;
  if (err instanceof InvalidTransitionError) return 409;
  if (err instanceof StatusDriftError) return 409;
  return 500;
}

/** Executa uma chamada do controller e mapeia erros de domínio para HTTP. */
async function handle(res: Response, fn: () => unknown, successCode = 200): Promise<void> {
  try {
    res.status(successCode).json(await Promise.resolve(fn()));
  } catch (err) {
    const code = statusFromError(err);
    if (code === 500) console.error('[API] erro interno:', err);
    res.status(code).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
  }
}

/**
 * Constrói o app Express SEM dar listen (testável). O entry point chama createApp().listen().
 * Permite injetar um TaskController (ex.: com rootDir temporário) nos testes.
 */
export function createApp(
  controller: TaskController = new TaskController(new TaskService({ rootDir: ROOT_DIR })),
): Express {
  const app = express();

  const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim());
  app.use(cors(allowed ? { origin: allowed } : {}));
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'nexus-backend' });
  });

  // ----------------------------------------------------------------- tasks
  app.get('/api/tasks', (req: Request, res: Response) =>
    handle(res, () =>
      controller.list({
        status: req.query.status as TaskStatus | undefined,
        targetAgent: req.query.target_agent as string | undefined,
      }),
    ),
  );

  app.get('/api/tasks/:id', (req: Request, res: Response) =>
    handle(res, () => controller.get(req.params.id)),
  );

  app.post('/api/tasks', (req: Request, res: Response) =>
    handle(res, () => {
      const b = req.body ?? {};
      return controller.create({
        id: b.id,
        title: b.title,
        complexity: b.complexity,
        targetAgent: b.target_agent,
        dependencies: b.dependencies,
        blocks: b.blocks,
      });
    }, 201),
  );

  app.post('/api/tasks/:id/transition', (req: Request, res: Response) =>
    handle(res, () => {
      const { action, agent, message } = req.body ?? {};
      return controller.transition(req.params.id, action, agent, message);
    }),
  );

  app.post('/api/tasks/:id/assign', (req: Request, res: Response) =>
    handle(res, () => {
      const { target_agent } = req.body ?? {};
      return controller.assign(req.params.id, target_agent);
    }),
  );

  app.post('/api/tasks/:id/log', (req: Request, res: Response) =>
    handle(res, () => {
      const { agent, message } = req.body ?? {};
      return controller.logProgress(req.params.id, agent, message);
    }),
  );

  // ------------------------------------------- export (T-1015)
  app.post('/api/export', async (req: Request, res: Response) => {
    try {
      const { slugs, tags, depth } = req.body ?? {};
      const result = await buildExport({ slugs, tags }, { rootDir: ROOT_DIR, depth });
      res.json(result);
    } catch (err) {
      console.error('[API] export:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  });

  // ------------------------------------------- compress (T-1016)
  app.post('/api/compress', async (req: Request, res: Response) => {
    try {
      const { text } = req.body ?? {};
      if (typeof text !== 'string' || text.length === 0) {
        return res.status(400).json({ error: 'Campo "text" (string não-vazia) é obrigatório.' });
      }
      const result = await getCompressor().compress(text);
      res.json(result);
    } catch (err) {
      console.error('[API] compress:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  });

  return app;
}

// Entry point (CommonJS): só dá listen quando executado diretamente, não em testes/import.
if (typeof require !== 'undefined' && require.main === module) {
  createApp().listen(PORT, () => {
    console.log(`Nexus Backend running on port ${PORT}`);
  });
}
