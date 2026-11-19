import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './e2e',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3002',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {},
  },
  webServer: {
    command: 'npm run start -- --port 3002',
    url: 'http://127.0.0.1:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3002' },
  },
});
