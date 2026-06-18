import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { TaskListItem } from '../api';

// Mantém ApiError/tipos reais; substitui apenas o objeto `api` (rede).
// vi.hoisted: a factory de vi.mock é içada ao topo; o mock precisa existir antes.
const { listTasks } = vi.hoisted(() => ({ listTasks: vi.fn() }));
vi.mock('../api', async (importActual) => {
  const actual = await importActual<typeof import('../api')>();
  return {
    ...actual,
    api: { ...actual.api, listTasks },
  };
});

// TaskDrawer não é exercido aqui (nenhum card é clicado); stub leve evita fetch extra.
vi.mock('../components/TaskDrawer', () => ({ default: () => null }));

import TaskBoard from './TaskBoard';
import { ApiError } from '../api';

const tasks: TaskListItem[] = [
  { id: 'T-1', title: 'Primeira', status: 'ready', dependencies: [], blocks: [], target_agent: 'frontend_agent', complexity: 2 },
  { id: 'T-2', title: 'Segunda', status: 'in_progress', dependencies: [], blocks: [] },
];

describe('TaskBoard', () => {
  beforeEach(() => {
    listTasks.mockReset();
  });

  it('renderiza as colunas e os cards a partir do payload', async () => {
    listTasks.mockResolvedValueOnce(tasks);
    render(<TaskBoard />);

    // Colunas (rótulos das 7 etapas) aparecem após a carga.
    await waitFor(() => expect(screen.getByText('Ready')).toBeInTheDocument());
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();

    // Cards do payload.
    expect(screen.getByText('Primeira')).toBeInTheDocument();
    expect(screen.getByText('Segunda')).toBeInTheDocument();
    expect(screen.getByText('T-1')).toBeInTheDocument();
  });

  it('mostra a UI de erro quando o backend falha (não tela em branco)', async () => {
    listTasks.mockRejectedValueOnce(new ApiError(500, 'Backend caiu'));
    render(<TaskBoard />);

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Backend caiu');
  });
});
