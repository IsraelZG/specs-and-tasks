import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../src/components/Tooltip/Tooltip';

describe('Tooltip', () => {
  it('não renderiza tooltip quando fechado (smoke fechado)', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Info</TooltipTrigger>
          <TooltipContent>Texto de ajuda</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.queryByText('Texto de ajuda')).not.toBeInTheDocument();
  });

  it('exibe tooltip quando open=true', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Info</TooltipTrigger>
          <TooltipContent>Texto de ajuda</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    // Radix duplica o texto (tooltip content + screen-reader span com role=tooltip)
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('TooltipContent forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent ref={ref}>Conteúdo</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('renderiza corretamente com TooltipProvider', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Elemento com tooltip</TooltipTrigger>
          <TooltipContent>Dica</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    // O trigger é renderizado mesmo com tooltip fechado
    expect(screen.getByText('Elemento com tooltip')).toBeInTheDocument();
  });
});
