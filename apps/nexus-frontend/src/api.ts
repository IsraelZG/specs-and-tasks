/**
 * Client central da API do nexus-backend.
 * Base configurável por VITE_API_URL; checa response.ok e lança ApiError tipado.
 */
const BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export type TaskStatus =
  | 'draft'
  | 'ready'
  | 'in_progress'
  | 'review'
  | 'rework'
  | 'done'
  | 'blocked';

export interface LogEntry {
  timestamp: string;
  agent: string;
  label: string;
  message: string;
  raw: string;
}

export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus;
  complexity?: number;
  target_agent?: string;
  dependencies: string[];
  blocks: string[];
  branch?: string;
  lastLog?: LogEntry;
}

export interface TaskDetail extends TaskListItem {
  body: string;
  log: LogEntry[];
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new ApiError(0, `Não foi possível conectar ao backend (${BASE}).`);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export interface CreateTaskBody {
  id: string;
  title: string;
  complexity?: number;
  target_agent?: string;
  dependencies?: string[];
  blocks?: string[];
}

export const api = {
  listTasks(filter?: { status?: TaskStatus; target_agent?: string }): Promise<TaskListItem[]> {
    const qs = new URLSearchParams();
    if (filter?.status) qs.set('status', filter.status);
    if (filter?.target_agent) qs.set('target_agent', filter.target_agent);
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<TaskListItem[]>(`/api/tasks${suffix}`);
  },

  getTask(id: string): Promise<TaskDetail> {
    return request<TaskDetail>(`/api/tasks/${encodeURIComponent(id)}`);
  },

  createTask(body: CreateTaskBody): Promise<TaskDetail> {
    return postJson<TaskDetail>('/api/tasks', body);
  },

  transition(id: string, action: string, agent: string, message?: string): Promise<TaskDetail> {
    return postJson<TaskDetail>(`/api/tasks/${encodeURIComponent(id)}/transition`, {
      action,
      agent,
      message,
    });
  },

  assign(id: string, target_agent: string): Promise<TaskDetail> {
    return postJson<TaskDetail>(`/api/tasks/${encodeURIComponent(id)}/assign`, { target_agent });
  },

  logProgress(id: string, agent: string, message: string): Promise<TaskDetail> {
    return postJson<TaskDetail>(`/api/tasks/${encodeURIComponent(id)}/log`, { agent, message });
  },
};
