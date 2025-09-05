import { z } from 'zod'

// Environment variable schemas
const envSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Optional features
  NEXT_PUBLIC_ENABLE_PWA: z.enum(['0', '1']).default('0'),
  NEXT_PUBLIC_DEMO: z.enum(['0', '1']).default('0'),
  
  // App configuration
  NEXT_PUBLIC_APP_NAME: z.string().default('FashionZoom CRM'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('Lead capture, calling & WhatsApp follow-ups'),
  NEXT_PUBLIC_BRAND_COLOR: z.string().default('#F81F2E'),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_IMPORT: z.enum(['0', '1']).default('1'),
  NEXT_PUBLIC_ENABLE_EXPORT: z.enum(['0', '1']).default('0'),
  NEXT_PUBLIC_ENABLE_BULK_OPS: z.enum(['0', '1']).default('0'),
  
  // Limits
  NEXT_PUBLIC_MAX_IMPORT_SIZE: z.coerce.number().default(5000),
  NEXT_PUBLIC_MAX_PAGE_SIZE: z.coerce.number().default(100),
  NEXT_PUBLIC_DEFAULT_PAGE_SIZE: z.coerce.number().default(20),
  
  // External services (future)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
})

// Parse and validate environment
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter(e => e.message === 'Required')
        .map(e => e.path.join('.'))
      
      if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '))
      }
      
      const invalid = error.errors
        .filter(e => e.message !== 'Required')
        .map(e => `${e.path.join('.')}: ${e.message}`)
      
      if (invalid.length > 0) {
        console.error('❌ Invalid environment variables:', invalid.join(', '))
      }
      
      throw new Error('Environment validation failed')
    }
    throw error
  }
}

// Cached config
let _config: z.infer<typeof envSchema> | null = null

export function getConfig() {
  if (!_config) {
    _config = validateEnv()
  }
  return _config
}

// Type-safe config object
export const config = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    return getConfig()[prop as keyof z.infer<typeof envSchema>]
  }
})

// Feature flag helpers
export const features = {
  isPWAEnabled: () => config.NEXT_PUBLIC_ENABLE_PWA === '1',
  isDemoMode: () => config.NEXT_PUBLIC_DEMO === '1',
  isImportEnabled: () => config.NEXT_PUBLIC_ENABLE_IMPORT === '1',
  isExportEnabled: () => config.NEXT_PUBLIC_ENABLE_EXPORT === '1',
  isBulkOpsEnabled: () => config.NEXT_PUBLIC_ENABLE_BULK_OPS === '1',
}

// App metadata helper
export function getAppMetadata() {
  return {
    title: config.NEXT_PUBLIC_APP_NAME,
    description: config.NEXT_PUBLIC_APP_DESCRIPTION,
    themeColor: config.NEXT_PUBLIC_BRAND_COLOR,
  }
}

// Limits helper
export function getLimits() {
  return {
    maxImportSize: config.NEXT_PUBLIC_MAX_IMPORT_SIZE,
    maxPageSize: config.NEXT_PUBLIC_MAX_PAGE_SIZE,
    defaultPageSize: config.NEXT_PUBLIC_DEFAULT_PAGE_SIZE,
  }
}