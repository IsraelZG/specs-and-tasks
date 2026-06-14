import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  content: string;
  status: string;
  title: string;
  complexity: string;
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/tasks')
      .then(res => res.json())
      .then(data => {
        const parsed = data.map((t: any) => {
          // Extrair metadados do Frontmatter via regex simples
          const statusMatch = t.content.match(/status:\s*([^\n]+)/);
          const titleMatch = t.content.match(/title:\s*"([^"]+)"/);
          const compMatch = t.content.match(/complexity:\s*([^\n]+)/);
          
          return {
            id: t.id,
            status: statusMatch ? statusMatch[1].trim() : 'draft',
            title: titleMatch ? titleMatch[1].trim() : 'Sem título',
            complexity: compMatch ? compMatch[1].trim() : '?',
            content: t.content
          };
        });
        setTasks(parsed);
      })
      .catch(err => console.error("API falhou", err));
  }, []);

  const columns = ['draft', 'ready', 'in_progress', 'blocked', 'done'];

  return (
    <div>
      <h1 className="page-title">Agentic Task Board (MGTIA-v2)</h1>
      <div className="kanban-board">
        {columns.map(col => (
          <div key={col} className="kanban-column">
            <div className="column-header">
              <span style={{textTransform: 'uppercase'}}>{col.replace('_', ' ')}</span>
              <span>{tasks.filter(t => t.status === col).length}</span>
            </div>
            {tasks.filter(t => t.status === col).map(task => (
              <motion.div 
                key={task.id}
                className="task-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="task-id">{task.id}</div>
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span>Cplx: {task.complexity}</span>
                  <span style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                    padding: '2px 6px', 
                    borderRadius: '4px'
                  }}>
                    {task.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
