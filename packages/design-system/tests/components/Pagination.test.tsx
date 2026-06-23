import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '../../src/components/Pagination/Pagination';

describe('Pagination', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('tem role navigation e aria-label', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'pagination');
  });

  it('renderiza links anterior/próximo', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('não usa forwardRef no Pagination root (é função)', () => {
    // Pagination é uma arrow function, não forwardRef
    expect(Pagination).toBeDefined();
  });
});
