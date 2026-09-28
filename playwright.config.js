import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1366, height: 768 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'], browserName: 'chromium' } },
  ],
  webServer: { command: 'node scripts/serve-test.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});
