import { test } from '@japa/runner'
import { RuntimeException } from '@adonisjs/core/exceptions'
import type { ApplicationService } from '@adonisjs/core/types'

import XenditProvider from '../providers/xendit_provider.ts'
import { XenditManager } from '../src/xendit_manager.ts'
import { defineConfig } from '../src/define_config.ts'

test.group('XenditProvider', () => {
  test('registers xendit.manager as singleton binding', async ({ assert }) => {
    let capturedBinding = ''
    let factory: Function

    const app = {
      container: {
        singleton(binding: string, fn: Function) {
          capturedBinding = binding
          factory = fn
        },
      },
      config: {
        get() {
          return defineConfig({ secretKey: 'sk_test', environment: 'sandbox' })
        },
      },
    } as unknown as ApplicationService

    const provider = new XenditProvider(app)
    provider.register()

    assert.equal(capturedBinding, 'xendit.manager')
    assert.instanceOf(await factory!(), XenditManager)
  })

  test('resolves XenditManager with valid config provider', async ({ assert }) => {
    let factory: Function

    const app = {
      container: {
        singleton(_binding: string, fn: Function) {
          factory = fn
        },
      },
      config: {
        get() {
          return defineConfig({ secretKey: 'sk_test', environment: 'production' })
        },
      },
    } as unknown as ApplicationService

    const provider = new XenditProvider(app)
    provider.register()

    const manager: XenditManager = await factory!()
    assert.instanceOf(manager, XenditManager)
  })

  test('throws RuntimeException when config.get returns empty default', async ({ assert }) => {
    let factory: Function

    const app = {
      container: {
        singleton(_binding: string, fn: Function) {
          factory = fn
        },
      },
      config: {
        get() {
          return {}
        },
      },
    } as unknown as ApplicationService

    const provider = new XenditProvider(app)
    provider.register()

    await assert.rejects(async () => {
      await factory!()
    }, RuntimeException)
  })

  test('throws RuntimeException when provider resolves to config missing secretKey', async ({
    assert,
  }) => {
    let factory: Function

    const app = {
      container: {
        singleton(_binding: string, fn: Function) {
          factory = fn
        },
      },
      config: {
        get() {
          return {
            type: 'provider',
            resolver: async () => ({ environment: 'sandbox' }),
          }
        },
      },
    } as unknown as ApplicationService

    const provider = new XenditProvider(app)
    provider.register()

    await assert.rejects(async () => {
      await factory!()
    }, RuntimeException)
  })
})
