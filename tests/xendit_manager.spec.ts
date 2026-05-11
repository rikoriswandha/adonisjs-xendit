import { test } from '@japa/runner'
import { XenditManager } from '../src/xendit_manager.ts'
import { InvoiceClient } from '../src/clients/invoice_client.ts'
import { VirtualAccountClient } from '../src/clients/va_client.ts'
import { EWalletClient } from '../src/clients/ewallet_client.ts'
import { QrisClient } from '../src/clients/qris_client.ts'
import { RetailOutletClient } from '../src/clients/retail_outlet_client.ts'
import { CreditCardClient } from '../src/clients/credit_card_client.ts'
import { DirectDebitClient } from '../src/clients/direct_debit_client.ts'
import { DisbursementClient } from '../src/clients/disbursement_client.ts'
import { BalanceClient } from '../src/clients/balance_client.ts'

test.group('XenditManager', () => {
  function createManager() {
    return new XenditManager({
      secretKey: 'xnd_test_secret',
      environment: 'sandbox',
    })
  }

  test('create manager with minimum config', ({ assert }) => {
    const manager = createManager()
    assert.instanceOf(manager, XenditManager)
  })

  test('create manager with full config', ({ assert }) => {
    const manager = new XenditManager({
      secretKey: 'xnd_test_secret',
      environment: 'production',
      callbackToken: 'cb_token',
      timeoutMs: 15000,
    })
    assert.instanceOf(manager, XenditManager)
  })

  test('invoice() returns InvoiceClient', ({ assert }) => {
    assert.instanceOf(createManager().invoice(), InvoiceClient)
  })

  test('va() returns VirtualAccountClient', ({ assert }) => {
    assert.instanceOf(createManager().va(), VirtualAccountClient)
  })

  test('ewallet() returns EWalletClient', ({ assert }) => {
    assert.instanceOf(createManager().ewallet(), EWalletClient)
  })

  test('qris() returns QrisClient', ({ assert }) => {
    assert.instanceOf(createManager().qris(), QrisClient)
  })

  test('retailOutlet() returns RetailOutletClient', ({ assert }) => {
    assert.instanceOf(createManager().retailOutlet(), RetailOutletClient)
  })

  test('creditCard() returns CreditCardClient', ({ assert }) => {
    assert.instanceOf(createManager().creditCard(), CreditCardClient)
  })

  test('directDebit() returns DirectDebitClient', ({ assert }) => {
    assert.instanceOf(createManager().directDebit(), DirectDebitClient)
  })

  test('disbursement() returns DisbursementClient', ({ assert }) => {
    assert.instanceOf(createManager().disbursement(), DisbursementClient)
  })

  test('balance() returns BalanceClient', ({ assert }) => {
    assert.instanceOf(createManager().balance(), BalanceClient)
  })

  test('same accessor returns the same cached instance', ({ assert }) => {
    const manager = createManager()

    const first = manager.invoice()
    const second = manager.invoice()
    assert.strictEqual(first, second)
  })

  test('different accessors return different instances', ({ assert }) => {
    const manager = createManager()

    const invoice = manager.invoice()
    const va = manager.va()
    assert.notStrictEqual(invoice, va)
  })

  test('all 9 accessors return distinct cached instances', ({ assert }) => {
    const manager = createManager()

    const invoice1 = manager.invoice()
    const invoice2 = manager.invoice()
    const va1 = manager.va()
    const va2 = manager.va()
    const ewallet1 = manager.ewallet()
    const ewallet2 = manager.ewallet()
    const qris1 = manager.qris()
    const qris2 = manager.qris()
    const retail1 = manager.retailOutlet()
    const retail2 = manager.retailOutlet()
    const cc1 = manager.creditCard()
    const cc2 = manager.creditCard()
    const dd1 = manager.directDebit()
    const dd2 = manager.directDebit()
    const disb1 = manager.disbursement()
    const disb2 = manager.disbursement()
    const bal1 = manager.balance()
    const bal2 = manager.balance()

    assert.strictEqual(invoice1, invoice2)
    assert.strictEqual(va1, va2)
    assert.strictEqual(ewallet1, ewallet2)
    assert.strictEqual(qris1, qris2)
    assert.strictEqual(retail1, retail2)
    assert.strictEqual(cc1, cc2)
    assert.strictEqual(dd1, dd2)
    assert.strictEqual(disb1, disb2)
    assert.strictEqual(bal1, bal2)

    const instances = [invoice1, va1, ewallet1, qris1, retail1, cc1, dd1, disb1, bal1]
    assert.lengthOf(instances, 9)
    assert.equal(new Set(instances).size, 9)
  })
})
