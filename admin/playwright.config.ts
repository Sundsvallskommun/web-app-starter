import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ?? '3002';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const baseURL = `http://localhost:${port}${basePath}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Boots the Next dev server before the suite. Locally an already-running server is reused;
  // CI always starts a fresh one. Env satisfies envalid (next.config.js) without a checked-in .env.
  webServer: {
    command: 'yarn dev',
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
      DOMAIN_NAME: 'localhost',
      BASE_PATH: '',
      NEXT_PUBLIC_BASE_PATH: '',
      HEALTH_AUTH: 'false',
      HEALTH_USERNAME: '',
      HEALTH_PASSWORD: '',
    },
  },
});
