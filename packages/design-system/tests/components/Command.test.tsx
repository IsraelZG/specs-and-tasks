import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '../../src/components/Command/Command';

async function flushEnterAnimation() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

describe('Command', () => {
  it('não renderiza o diálogo quando fechado', () => {
    render(
      <CommandDialog open={false} onOpenChange={() => {}}>
        <CommandInput placeholder="Buscar..." />
      </CommandDialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre e renderiza input + lista quando open=true', async () => {
    render(
      <CommandDialog open onOpenChange={() => {}}>
        <CommandInput placeholder="Buscar..." />
        <CommandList>
          <CommandGroup heading="Ações">
            <CommandItem onSelect={() => {}}>Salvar</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );

    await flushEnterAnimation();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('dispara onOpenChange ao fechar via close do Modal', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CommandDialog open onOpenChange={onOpenChange}>
        <CommandInput placeholder="Buscar..." />
      </CommandDialog>
    );

    await flushEnterAnimation();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('CommandInput dispara onValueChange ao digitar', async () => {
    const onValueChange = vi.fn();
    render(
      <CommandDialog open onOpenChange={() => {}}>
        <CommandInput placeholder="Buscar..." onValueChange={onValueChange} />
      </CommandDialog>
    );

    await flushEnterAnimation();
    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement;

    // Disparar onChange manualmente — o Modal usa Portal + focus trap,
    // o que dificulta teste de digitação com userEvent via keyboard()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    nativeInputValueSetter?.call(input, 'a');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('CommandItem forwardRef chega ao nó DOM', async () => {
    const ref = { current: null };
    render(
      <CommandDialog open onOpenChange={() => {}}>
        <CommandList>
          <CommandGroup heading="Itens">
            <CommandItem ref={ref} onSelect={() => {}}>Item</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );

    await flushEnterAnimation();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('CommandItem chama onSelect ao clicar', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <CommandDialog open onOpenChange={() => {}}>
        <CommandList>
          <CommandGroup heading="Itens">
            <CommandItem onSelect={onSelect}>Item</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );

    await flushEnterAnimation();
    await user.click(screen.getByText('Item'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('CommandShortcut renderiza atalho de teclado', async () => {
    render(
      <CommandDialog open onOpenChange={() => {}}>
        <CommandList>
          <CommandGroup heading="Itens">
            <CommandItem onSelect={() => {}}>
              Salvar <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );

    await flushEnterAnimation();
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });
});
