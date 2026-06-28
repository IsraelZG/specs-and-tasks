import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, type TaskListItem } from './api';

const BASE = 'http://localhost:3001';

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number; statusText?: string }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: async () => body,
  } as Response;
}

const sampleTask: TaskListItem = {
  id: 'T-9001',
  title: 'Exemplo',
  status: 'ready',
  dependencies: [],
  blocks: [],
};

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('listTasks faz GET em /api/tasks e retorna o payload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([sampleTask]));
    const tasks = await api.listTasks();
    expect(tasks).toEqual([sampleTask]);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/tasks`, undefined);
  });

  it('listTasks serializa filtros como query string', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]));
    await api.listTasks({ status: 'in_progress', target_agent: 'frontend_agent' });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('status=in_progress');
    expect(url).toContain('target_agent=frontend_agent');
  });

  it('getTask codifica o id na URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ...sampleTask, body: '', log: [] }));
    await api.getTask('T-9001');
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/tasks/T-9001`, undefined);
  });

  it('transition faz POST com action/agent/message no corpo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ...sampleTask, body: '', log: [] }));
    await api.transition('T-9001', 'start', 'claude', 'oi');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ action: 'start', agent: 'claude', message: 'oi' });
  });

  it('lança ApiError com a mensagem do corpo quando !response.ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: 'transição inválida' }, { ok: false, status: 409, statusText: 'Conflict' }),
    );
    await expect(api.transition('T-9001', 'approve', 'claude')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'transição inválida',
    });
  });

  it('lança ApiError(0) quando o fetch falha (backend offline)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = await api.listTasks().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});
