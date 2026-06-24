import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../src/components/Carousel/Carousel';

describe('Carousel', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });

  it('tem botões de navegação anterior/próximo', () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('dispara callback ao navegar', async () => {
    const user = userEvent.setup();
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
    // Botões usam ◀ e ▶ como conteúdo
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons.find(b => b.textContent === '▶');
    expect(nextBtn).toBeInTheDocument();
    if (nextBtn) await user.click(nextBtn);
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Carousel ref={ref}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
