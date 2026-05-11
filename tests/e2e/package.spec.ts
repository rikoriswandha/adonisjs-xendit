import { test } from '@japa/runner'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const testDir = dirname(fileURLToPath(import.meta.url))
const build = join(testDir, '../../build')

test.group('Package E2E', () => {
  test('build output exists with expected files', ({ assert }) => {
    assert.isTrue(existsSync(join(build, 'index.js')), 'build/index.js exists')
    assert.isTrue(existsSync(join(build, 'index.d.ts')), 'build/index.d.ts exists')
    assert.isTrue(existsSync(join(build, 'configure.js')), 'build/configure.js exists')
    assert.isTrue(existsSync(join(build, 'configure.d.ts')), 'build/configure.d.ts exists')
    assert.isTrue(
      existsSync(join(build, 'stubs/config/xendit.stub')),
      'build/stubs/config/xendit.stub exists'
    )
    assert.isTrue(
      existsSync(join(build, 'providers/xendit_provider.d.ts')),
      'build/providers/xendit_provider.d.ts exists'
    )
    assert.isTrue(
      existsSync(join(build, 'src/xendit_exception.js')),
      'build/src/xendit_exception.js exists'
    )
  })

  test('all named exports are accessible from built package', async ({ assert }) => {
    const pkg = await import('../../build/index.js')

    assert.isFunction(pkg.configure, 'configure is exported')
    assert.isFunction(pkg.defineConfig, 'defineConfig is exported')
    assert.isFunction(pkg.XenditManager, 'XenditManager is exported')
    assert.isFunction(pkg.XenditWebhook, 'XenditWebhook is exported')
    assert.isFunction(pkg.BalanceClient, 'BalanceClient is exported')
    assert.isFunction(pkg.CreditCardClient, 'CreditCardClient is exported')
    assert.isFunction(pkg.DirectDebitClient, 'DirectDebitClient is exported')
    assert.isFunction(pkg.DisbursementClient, 'DisbursementClient is exported')
    assert.isFunction(pkg.EWalletClient, 'EWalletClient is exported')
    assert.isFunction(pkg.InvoiceClient, 'InvoiceClient is exported')
    assert.isFunction(pkg.QrisClient, 'QrisClient is exported')
    assert.isFunction(pkg.RetailOutletClient, 'RetailOutletClient is exported')
    assert.isFunction(pkg.VirtualAccountClient, 'VirtualAccountClient is exported')
  })

  test('errors namespace exports all exception classes', async ({ assert }) => {
    const { errors } = await import('../../build/index.js')

    assert.isDefined(errors, 'errors namespace exists')
    assert.isFunction(errors.XenditException, 'XenditException')
    assert.isFunction(errors.XenditValidationError, 'XenditValidationError')
    assert.isFunction(errors.XenditAuthenticationError, 'XenditAuthenticationError')
    assert.isFunction(errors.XenditNotFoundError, 'XenditNotFoundError')
    assert.isFunction(errors.XenditConflictError, 'XenditConflictError')
    assert.isFunction(errors.XenditRateLimitError, 'XenditRateLimitError')
    assert.isFunction(errors.XenditServerError, 'XenditServerError')
    assert.isFunction(errors.XenditNetworkError, 'XenditNetworkError')
  })

  test('provider can be imported and resolves xendit.manager from container', async ({
    assert,
  }) => {
    const { default: XenditProvider } = await import('../../build/providers/xendit_provider.js')
    const { defineConfig } = await import('../../build/index.js')

    assert.isFunction(XenditProvider, 'XenditProvider is a class')

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
          return defineConfig({ secretKey: 'sk_test_123', environment: 'sandbox' })
        },
      },
    }

    const provider = new XenditProvider(app as any)
    provider.register()

    assert.equal(capturedBinding, 'xendit.manager')
    assert.isFunction(factory!)

    const manager = await factory!()
    assert.isDefined(manager)
    assert.isFunction(manager.invoice)
    assert.isFunction(manager.va)
    assert.isFunction(manager.ewallet)
    assert.isFunction(manager.qris)
    assert.isFunction(manager.retailOutlet)
    assert.isFunction(manager.creditCard)
    assert.isFunction(manager.directDebit)
    assert.isFunction(manager.disbursement)
    assert.isFunction(manager.balance)
  })

  test('defineConfig validates config and returns ConfigProvider', async ({ assert }) => {
    const { defineConfig } = await import('../../build/index.js')

    const provider = defineConfig({
      secretKey: 'sk_test',
      environment: 'sandbox',
    })

    assert.equal(provider.type, 'provider')
    assert.isFunction(provider.resolver)

    const config = await provider.resolver({} as any)
    assert.equal(config.secretKey, 'sk_test')
    assert.equal(config.environment, 'sandbox')
    assert.equal(config.timeoutMs, 30000)
  })

  test('XenditManager can be instantiated and all 9 clients are accessible', async ({ assert }) => {
    const { XenditManager, defineConfig } = await import('../../build/index.js')

    const config = await defineConfig({
      secretKey: 'sk_test',
      environment: 'sandbox',
    }).resolver({} as any)

    const manager = new XenditManager(config)

    assert.instanceOf(manager, XenditManager)

    assert.isDefined(manager.invoice())
    assert.isDefined(manager.va())
    assert.isDefined(manager.ewallet())
    assert.isDefined(manager.qris())
    assert.isDefined(manager.retailOutlet())
    assert.isDefined(manager.creditCard())
    assert.isDefined(manager.directDebit())
    assert.isDefined(manager.disbursement())
    assert.isDefined(manager.balance())
  })

  test('XenditWebhook verify and parseEvent are functional', async ({ assert }) => {
    const { XenditWebhook } = await import('../../build/index.js')

    assert.isFunction(XenditWebhook.verify)
    assert.isFunction(XenditWebhook.parseEvent)

    const payload = JSON.stringify({ event: 'invoice.paid', data: { id: '123' } })
    const event = XenditWebhook.parseEvent(payload)
    assert.deepEqual(event, { event: 'invoice.paid', data: { id: '123' } })

    const result = XenditWebhook.verify(payload, 'token', 'wrong-sig')
    assert.isFalse(result)
  })

  test('configure function is exported and is a function', async ({ assert }) => {
    const { configure } = await import('../../build/index.js')
    assert.isFunction(configure)
  })
})
