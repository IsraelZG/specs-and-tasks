import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../src/components/Breadcrumb/Breadcrumb';

describe('Breadcrumb', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('tem role navigation e aria-label', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
  });

  it('forwardRef no Breadcrumb chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Breadcrumb ref={ref}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>P</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
