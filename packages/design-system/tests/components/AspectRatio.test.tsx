import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AspectRatio } from '../../src/components/AspectRatio/AspectRatio';

describe('AspectRatio', () => {
  it('renderiza sem erro com ratio (smoke)', () => {
    const { container } = render(
      <div style={{ width: 200 }}>
        <AspectRatio ratio={16 / 9}>
          <div>Conteúdo</div>
        </AspectRatio>
      </div>
    );
    expect(container.querySelector('[style*="position: relative"]')).toBeTruthy();
  });

  it('aceita children', () => {
    const { container } = render(
      <div style={{ width: 200 }}>
        <AspectRatio ratio={1}>
          <span>Filho</span>
        </AspectRatio>
      </div>
    );
    expect(container.textContent).toContain('Filho');
  });
});
