import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

/**
 * Path to the root directory where the stubs are stored.
 * Computed from import.meta.url so it remains correct after bundling.
 */
export const stubsRoot = dirname(fileURLToPath(import.meta.url))
