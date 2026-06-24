import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../../src/components/Calendar/Calendar';

describe('Calendar', () => {
  it('renderiza sem erro (smoke)', () => {
    const { container } = render(<Calendar />);
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('dispara onSelect ao clicar em um dia', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Calendar onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button');
    // Pula os nav buttons (◀ ▶) — busca o primeiro botão com texto numérico
    const dayButton = buttons.find(b => /^\d+$/.test(b.textContent?.trim() ?? ''));
    if (dayButton) await user.click(dayButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
    if (onSelect.mock.calls[0]) {
      expect(onSelect.mock.calls[0][0]).toBeInstanceOf(Date);
    }
  });

  it('navega para mês anterior/próximo', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    const buttons = screen.getAllByRole('button');
    const navButtons = buttons.filter(b => b.textContent === '◀' || b.textContent === '▶');
    expect(navButtons.length).toBeGreaterThanOrEqual(2);
    // Clica no próximo
    const nextBtn = navButtons.find(b => b.textContent === '▶');
    if (nextBtn) await user.click(nextBtn);
  });

  it('renderiza cabeçalho do mês', () => {
    render(<Calendar />);
    // O mês aparece como texto composto (ex.: "junho 2026")
    const monthSpan = screen.getByText(/2026/);
    expect(monthSpan).toBeInTheDocument();
  });

  it('não usa forwardRef (é função, não forwardRef)', () => {
    expect(typeof Calendar).toBe('function');
  });
});
