import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, ApiError, type TaskListItem, type TaskStatus } from '../api';
import { COLUMNS, STATUS_LABEL, actionForTarget } from '../transitions';
import TaskDrawer from '../components/TaskDrawer';

function useAgentName(): [string, (v: string) => void] {
  const [agent, setAgent] = useState<string>(() => localStorage.getItem('nexus.agent') ?? 'operator');
  const update = (v: string) => {
    setAgent(v);
    localStorage.setItem('nexus.agent', v);
  };
  return [agent, update];
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [agent, setAgent] = useAgentName();

  const load = useCallback(async () => {
    try {
      const data = await api.listTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial: fetch no mount é uma sincronização legítima com o backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function onDrop(target: TaskStatus) {
    setDropTarget(null);
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    if (!task) return;
    const action = actionForTarget(task.status, target);
    if (!action) {
      setError(`Movimento inválido: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[target]}.`);
      return;
    }
    try {
      setError(null);
      await api.transition(task.id, action, agent);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha na transição.');
    }
  }

  return (
    <div>
      <div className="board-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Agentic Task Board (MGTIA-v2)</h1>
        <label className="agent-field">
          Agente:
          <input value={agent} onChange={(e) => setAgent(e.target.value)} aria-label="Nome do agente" />
        </label>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Fechar erro">×</button>
        </div>
      )}

      {loading ? (
        <div className="board-status">Carregando tarefas…</div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                className={`kanban-column ${dropTarget === col ? 'drop-target' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dropTarget !== col) setDropTarget(col);
                }}
                onDragLeave={() => setDropTarget((t) => (t === col ? null : t))}
                onDrop={() => void onDrop(col)}
              >
                <div className="column-header">
                  <span style={{ textTransform: 'uppercase' }}>{STATUS_LABEL[col]}</span>
                  <span className="column-count">{items.length}</span>
                </div>
                {items.map((task) => (
                  <motion.div
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelectedId(task.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="task-id">{task.id}</div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span>{task.target_agent ?? '—'}</span>
                      <span>Cplx: {task.complexity ?? '?'}</span>
                    </div>
                    {task.branch && <div className="task-branch">⎇ {task.branch}</div>}
                    {task.lastLog && (
                      <div className="task-lastlog" title={task.lastLog.raw}>
                        {task.lastLog.label} {task.lastLog.message}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {selectedId && (
        <TaskDrawer
          id={selectedId}
          agent={agent}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
