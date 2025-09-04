import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: ['tests/**/*.spec.ts'],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: { E2E: '1', ...process.env },
  },
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
  }
})
