import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(new URL('./', import.meta.url)))

export default defineConfig({
  resolve: {
    alias: {
      '@': rootDir,
      '@/*': rootDir,
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
})
