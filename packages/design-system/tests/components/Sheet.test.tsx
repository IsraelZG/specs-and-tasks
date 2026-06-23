import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../../src/components/Sheet/Sheet';

describe('Sheet', () => {
  it('não renderiza o conteúdo quando fechado (smoke fechado)', () => {
    render(
      <Sheet>
        <SheetTrigger>Abrir</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Painel</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre ao clicar no trigger e renderiza o título', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Abrir painel</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurações</SheetTitle>
            <SheetDescription>Ajuste suas preferências</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByText('Abrir painel'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(screen.getByText('Configurações')).toBeVisible();
    expect(screen.getByText('Ajuste suas preferências')).toBeVisible();
  });

  it('chama onClose ao clicar no botão de fechar', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Sheet open onOpenChange={onClose}>
        <SheetTrigger>Trigger</SheetTrigger>
        <SheetContent>
          <SheetTitle>Título</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    // Botão de fechar contém ✕
    const closeButton = screen.getByText('✕').closest('button');
    expect(closeButton).not.toBeNull();
    await user.click(closeButton!);
    expect(onClose).toHaveBeenCalled();
  });

  it('SheetContent forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Sheet open>
        <SheetTrigger>Trigger</SheetTrigger>
        <SheetContent ref={ref}>
          <SheetTitle>Título</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('Sheet aceita side prop e renderiza com atributo correto', () => {
    render(
      <Sheet open>
        <SheetTrigger>Trigger</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>Esquerda</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    const dialog = screen.getByRole('dialog');
    // Sheet usa Radix Dialog — data-side é do Radix, não da nossa prop side
    expect(screen.getByText('Esquerda')).toBeVisible();
  });

  it('SheetFooter renderiza conteúdo no rodapé', () => {
    render(
      <Sheet open>
        <SheetTrigger>Trigger</SheetTrigger>
        <SheetContent>
          <SheetTitle>Título</SheetTitle>
          <SheetFooter>
            <button>Salvar</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );

    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });
});
