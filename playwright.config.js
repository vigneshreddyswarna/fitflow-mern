const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'on-first-retry' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
