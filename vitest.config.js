import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['server/**/*.js'],
      exclude: ['server/scripts/**'],
      thresholds: { lines: 45, functions: 20, statements: 45, branches: 25 }
    }
  }
});
