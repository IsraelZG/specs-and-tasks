import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeAll(() => {
  // JSDOM não implementa ResizeObserver — mock necessário para Slider (Radix)
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
  // JSDOM não implementa hasPointerCapture — mock necessário para Select (Radix)
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

// No `test.globals` in vitest.config.ts (kept explicit, like the rest of the
// monorepo's test files), so @testing-library/react's own auto-cleanup never
// registers — wire it up here instead.
afterEach(() => {
  cleanup();
});
