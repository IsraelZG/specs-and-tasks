import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000, // Large timeout for the model to download/load
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
