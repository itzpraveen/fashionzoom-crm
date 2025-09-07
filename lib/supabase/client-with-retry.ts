// Deprecated: the previous retry wrapper caused fragile promise chains
// and broke PostgREST query builders. Re-export the stable client instead.
export { createBrowserClient } from './client'
