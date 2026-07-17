import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['server/**/*.js'],
      exclude: ['server/scripts/**'],
      thresholds: { lines: 50, functions: 25, statements: 50, branches: 50 }
    }
  }
});
