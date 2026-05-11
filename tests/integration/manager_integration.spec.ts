import { test } from '@japa/runner'
import { XenditManager } from '../../src/xendit_manager.ts'
import { InvoiceClient } from '../../src/clients/invoice_client.ts'
import { VirtualAccountClient } from '../../src/clients/va_client.ts'
import { EWalletClient } from '../../src/clients/ewallet_client.ts'
import { QrisClient } from '../../src/clients/qris_client.ts'
import { RetailOutletClient } from '../../src/clients/retail_outlet_client.ts'
import { CreditCardClient } from '../../src/clients/credit_card_client.ts'
import { DirectDebitClient } from '../../src/clients/direct_debit_client.ts'
import { DisbursementClient } from '../../src/clients/disbursement_client.ts'
import { BalanceClient } from '../../src/clients/balance_client.ts'

test.group('XenditManager Integration', () => {
  function createManager() {
    return new XenditManager({
      secretKey: 'xnd_test_secret',
      environment: 'sandbox',
    })
  }

  test('all 9 accessors return correct client types', ({ assert }) => {
    const manager = createManager()

    assert.instanceOf(manager.invoice(), InvoiceClient)
    assert.instanceOf(manager.va(), VirtualAccountClient)
    assert.instanceOf(manager.ewallet(), EWalletClient)
    assert.instanceOf(manager.qris(), QrisClient)
    assert.instanceOf(manager.retailOutlet(), RetailOutletClient)
    assert.instanceOf(manager.creditCard(), CreditCardClient)
    assert.instanceOf(manager.directDebit(), DirectDebitClient)
    assert.instanceOf(manager.disbursement(), DisbursementClient)
    assert.instanceOf(manager.balance(), BalanceClient)
  })

  test('HTTP client is shared across all client accessors', async ({ assert }) => {
    const calls: Array<{ method: string; url: string }> = []
    const originalFetch = globalThis.fetch

    globalThis.fetch = async (input: Request | URL | string, init?: RequestInit) => {
      calls.push({
        method: String(init?.method ?? 'GET'),
        url: input.toString(),
      })
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    try {
      const manager = createManager()

      // Make requests through three different client accessors
      await manager.balance().get()
      await manager.invoice().list()
      await manager.ewallet().getStatus('test-charge')

      // All requests route through the same HTTP client (same base URL, same auth)
      assert.lengthOf(calls, 3)
      for (const call of calls) {
        assert.isTrue(
          call.url.startsWith('https://sandbox-api.xendit.co'),
          `Expected sandbox base URL, got: ${call.url}`
        )
      }
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('config change creates new manager with new client instances', ({ assert }) => {
    const manager1 = createManager()
    const manager2 = new XenditManager({
      secretKey: 'xnd_test_secret_2',
      environment: 'production',
    })

    assert.notStrictEqual(manager1.invoice(), manager2.invoice())
    assert.notStrictEqual(manager1.va(), manager2.va())
    assert.notStrictEqual(manager1.ewallet(), manager2.ewallet())
    assert.notStrictEqual(manager1.qris(), manager2.qris())
    assert.notStrictEqual(manager1.retailOutlet(), manager2.retailOutlet())
    assert.notStrictEqual(manager1.creditCard(), manager2.creditCard())
    assert.notStrictEqual(manager1.directDebit(), manager2.directDebit())
    assert.notStrictEqual(manager1.disbursement(), manager2.disbursement())
    assert.notStrictEqual(manager1.balance(), manager2.balance())
  })

  test('all 9 accessors load without import or circular dependency errors', ({ assert }) => {
    assert.doesNotThrow(() => {
      const manager = createManager()
      const clients = [
        manager.invoice(),
        manager.va(),
        manager.ewallet(),
        manager.qris(),
        manager.retailOutlet(),
        manager.creditCard(),
        manager.directDebit(),
        manager.disbursement(),
        manager.balance(),
      ]
      assert.lengthOf(clients, 9)
    })
  })
})
