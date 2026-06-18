import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api, ApiError, type TaskDetail } from '../api';
import { AGENT_PROFILES, STATUS_LABEL, TRANSITIONS, actionsFor } from '../transitions';

interface Props {
  id: string;
  agent: string;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

export default function TaskDrawer({ id, agent, onClose, onChanged }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getTask(id);
      setTask(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar a tarefa.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Carrega o detalhe ao abrir/trocar de task: sincronização legítima com o backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function run(fn: () => Promise<TaskDetail>) {
    setBusy(true);
    setError(null);
    try {
      setTask(await fn());
      setNote('');
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Operação falhou.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="task-id">{id}</div>
            {task && <h2 className="drawer-title">{task.title}</h2>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {loading && <div className="board-status">Carregando…</div>}

        {task && (
          <>
            <div className="drawer-meta">
              <span className="badge">{STATUS_LABEL[task.status]}</span>
              <span>{task.target_agent ?? '—'}</span>
              <span>Cplx: {task.complexity ?? '?'}</span>
              {task.branch && <span>⎇ {task.branch}</span>}
            </div>

            <section className="drawer-section">
              <h3>Ações</h3>
              <div className="action-row">
                {actionsFor(task.status).map((a) => (
                  <button
                    key={a}
                    disabled={busy}
                    onClick={() => run(() => api.transition(task.id, a, agent, note || undefined))}
                  >
                    {TRANSITIONS[a].label}
                  </button>
                ))}
              </div>
              <div className="action-row">
                <select
                  defaultValue=""
                  disabled={busy}
                  aria-label="Designar agente"
                  onChange={(e) => {
                    if (e.target.value) run(() => api.assign(task.id, e.target.value));
                  }}
                >
                  <option value="" disabled>Designar agente…</option>
                  {AGENT_PROFILES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="action-row">
                <input
                  placeholder="Nota / handoff (vai no log; também usada como mensagem da ação)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-label="Nota de progresso"
                />
                <button
                  disabled={busy || !note.trim()}
                  onClick={() => run(() => api.logProgress(task.id, agent, note))}
                >
                  Registrar nota
                </button>
              </div>
            </section>

            <section className="drawer-section">
              <h3>Log de Execução</h3>
              {task.log.length === 0 && <div className="board-status">Sem registros.</div>}
              <ul className="log-timeline">
                {task.log.map((e, i) => (
                  <li key={i}>
                    <span className="log-time">{e.timestamp}</span>
                    <span className="log-agent">{e.agent}</span>
                    <span className="log-label">{e.label}</span>
                    {e.message && <span className="log-msg">{e.message}</span>}
                  </li>
                ))}
              </ul>
            </section>

            <section className="drawer-section">
              <h3>Conteúdo</h3>
              <pre className="task-body">{task.body}</pre>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
