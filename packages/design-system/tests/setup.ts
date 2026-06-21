import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// No `test.globals` in vitest.config.ts (kept explicit, like the rest of the
// monorepo's test files), so @testing-library/react's own auto-cleanup never
// registers — wire it up here instead.
afterEach(() => {
  cleanup();
});
