import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: ['tests/**/*.spec.ts'],
  workers: 1,
  webServer: {
    command: 'sh -c "pnpm build && pnpm start"',
    port: 3000,
    timeout: 180 * 1000,
    reuseExistingServer: false,
    env: { E2E: '1', NEXT_PUBLIC_DEMO: '1', ...process.env },
  },
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
  }
})

