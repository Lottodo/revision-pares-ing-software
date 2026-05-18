import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: 'on',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,   // 30s por acción individual
  },
  timeout: 180000,          // 3 minutos por test (cubre el ciclo completo autor→revisor)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    }
  ],
});

