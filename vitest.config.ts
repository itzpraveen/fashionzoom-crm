import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(new URL('./', import.meta.url)))

export default defineConfig(async () => {
  let tsconfigPathsPlugin: any = null
  try {
    tsconfigPathsPlugin = (await import('vite-tsconfig-paths')).default()
  } catch {}
  return {
    plugins: tsconfigPathsPlugin ? [tsconfigPathsPlugin] : [],
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true
        }
      }
    },
    resolve: {
      alias: [
        { find: /^@\//, replacement: `${rootDir}/` },
        { find: '@', replacement: rootDir },
        { find: '@/components', replacement: resolve(rootDir, 'components') },
        { find: '@/lib', replacement: resolve(rootDir, 'lib') },
        { find: '@/actions', replacement: resolve(rootDir, 'actions') },
      ]
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/unit/**/*.test.ts']
    }
  }
})
