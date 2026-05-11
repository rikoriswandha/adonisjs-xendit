import { test } from '@japa/runner'
import { InvalidArgumentsException } from '@adonisjs/core/exceptions'
import type { ApplicationService } from '@adonisjs/core/types'
import { defineConfig } from '../src/define_config.ts'

test.group('defineConfig', () => {
  test('returns a ConfigProvider with type provider', ({ assert }) => {
    const provider = defineConfig({
      secretKey: 'sk_test_123',
      environment: 'sandbox',
    })

    assert.property(provider, 'type')
    assert.equal(provider.type, 'provider')
    assert.property(provider, 'resolver')
  })

  test('throws InvalidArgumentsException when secretKey is missing', ({ assert }) => {
    assert.throws(
      () =>
        defineConfig({
          secretKey: '',
          environment: 'sandbox',
        }),
      InvalidArgumentsException
    )
  })

  test('throws InvalidArgumentsException when environment is invalid', ({ assert }) => {
    assert.throws(
      () =>
        defineConfig({
          secretKey: 'sk_test_123',
          // @ts-expect-error testing invalid value
          environment: 'invalid',
        }),
      InvalidArgumentsException
    )
  })

  test('defaults environment to sandbox when not provided', async ({ assert }) => {
    const provider = defineConfig({
      secretKey: 'sk_test_123',
    } as any)

    const config = await provider.resolver({} as ApplicationService)
    assert.equal(config.environment, 'sandbox')
  })

  test('defaults timeoutMs to 30000 when not provided', async ({ assert }) => {
    const provider = defineConfig({
      secretKey: 'sk_test_123',
      environment: 'production',
    })

    const config = await provider.resolver({} as ApplicationService)
    assert.equal(config.timeoutMs, 30_000)
  })

  test('resolves all config values through the lazy resolver', async ({ assert }) => {
    const provider = defineConfig({
      secretKey: 'sk_live_abc',
      environment: 'production',
      callbackToken: 'cb_token_456',
      timeoutMs: 10_000,
    })

    const config = await provider.resolver({} as ApplicationService)

    assert.equal(config.secretKey, 'sk_live_abc')
    assert.equal(config.environment, 'production')
    assert.equal(config.callbackToken, 'cb_token_456')
    assert.equal(config.timeoutMs, 10_000)
  })
})
