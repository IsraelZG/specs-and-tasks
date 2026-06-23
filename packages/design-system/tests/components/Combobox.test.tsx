import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from '../../src/components/Combobox/Combobox';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

describe('Combobox', () => {
  const renderCombobox = (props: Partial<Parameters<typeof Combobox>[0]> = {}) =>
    render(<Combobox options={options} {...props} />);

  it('renderiza sem erro com options (smoke)', () => {
    renderCombobox();
    expect(screen.getByText('Select option...')).toBeInTheDocument();
  });

  it('abre popover ao clicar e dispara onValueChange ao selecionar', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox({ onValueChange });

    // Abre o popover clicando no trigger
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Seleciona uma opção
    const option = await screen.findByText('Option 2');
    await user.click(option);

    expect(onValueChange).toHaveBeenCalledWith('2');
  });

  it('filtra options ao digitar no search', async () => {
    const user = userEvent.setup();
    renderCombobox();

    // Abre o popover
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Digita no input de busca
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'Option 1');

    // Option 1 aparece, Option 2 não
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('tem role combobox', () => {
    renderCombobox();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('não usa forwardRef (é function, não forwardRef)', () => {
    expect(typeof Combobox).toBe('function');
  });
});
