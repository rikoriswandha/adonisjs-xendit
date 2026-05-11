/*
|--------------------------------------------------------------------------
| Define config
|--------------------------------------------------------------------------
|
| The define config function is used to define the Xendit configuration
| for the application. It validates the config at call time and returns
| a ConfigProvider that resolves the configuration lazily when the
| application boots.
|
*/

import { configProvider } from '@adonisjs/core'
import { InvalidArgumentsException } from '@adonisjs/core/exceptions'
import type { ConfigProvider } from '@adonisjs/core/types'
import type { XenditConfig } from './types.ts'

/**
 * Defines the Xendit configuration for your AdonisJS application.
 * This function returns a config provider that resolves the Xendit
 * configuration lazily when the application boots.
 *
 * @param config - The Xendit configuration object
 *
 * @example
 * ```ts
 * import { defineConfig } from 'adonisjs-xendit'
 *
 * export default defineConfig({
 *   secretKey: env.get('XENDIT_SECRET_KEY'),
 *   environment: 'sandbox',
 *   callbackToken: env.get('XENDIT_CALLBACK_TOKEN'),
 * })
 * ```
 */
export function defineConfig(config: XenditConfig): ConfigProvider<XenditConfig> {
  /**
   * Secret key should always be provided
   */
  if (!config.secretKey) {
    throw new InvalidArgumentsException('Missing "secretKey" property in Xendit config')
  }

  /**
   * Environment should be either "sandbox" or "production"
   */
  if (config.environment && !['sandbox', 'production'].includes(config.environment)) {
    throw new InvalidArgumentsException(
      `Invalid "environment" value "${config.environment}". Expected "sandbox" or "production"`
    )
  }

  return configProvider.create(async (_app) => {
    return {
      secretKey: config.secretKey,
      environment: config.environment ?? 'sandbox',
      callbackToken: config.callbackToken,
      timeoutMs: config.timeoutMs ?? 30_000,
    }
  })
}
