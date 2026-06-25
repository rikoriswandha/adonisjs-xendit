import { test } from '@japa/runner'
import { XenditWebhook } from '../src/webhook.ts'

const callbackToken = 'supersecretcallbacktoken'

test.group('XenditWebhook.verifyCallbackToken', () => {
  test('returns true for matching token', ({ assert }) => {
    const result = XenditWebhook.verifyCallbackToken(callbackToken, callbackToken)
    assert.isTrue(result)
  })

  test('returns false for wrong token', ({ assert }) => {
    const result = XenditWebhook.verifyCallbackToken('wrongtoken', callbackToken)
    assert.isFalse(result)
  })

  test('returns false for empty received token', ({ assert }) => {
    const result = XenditWebhook.verifyCallbackToken('', callbackToken)
    assert.isFalse(result)
  })

  test('returns false for empty expected token', ({ assert }) => {
    const result = XenditWebhook.verifyCallbackToken(callbackToken, '')
    assert.isFalse(result)
  })

  test('returns false when token lengths differ', ({ assert }) => {
    const result = XenditWebhook.verifyCallbackToken('short', callbackToken)
    assert.isFalse(result)
  })

  test('uses constant-time comparison (does not short-circuit)', ({ assert }) => {
    // A token that matches in the first N bytes but differs in length
    const result = XenditWebhook.verifyCallbackToken(callbackToken.slice(0, 10), callbackToken)
    assert.isFalse(result)
  })
})

test.group('XenditWebhook.parseEvent — envelope payloads', () => {
  test('parses invoice.paid event', ({ assert }) => {
    const payload = JSON.stringify({
      event: 'invoice.paid',
      data: { id: 'inv_123', status: 'PAID', amount: 100000 },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'invoice.paid')
    assert.deepEqual(event.data, { id: 'inv_123', status: 'PAID', amount: 100000 })
  })

  test('parses va.paid event', ({ assert }) => {
    const payload = JSON.stringify({
      event: 'va.paid',
      data: { id: 'va_456', account_number: '1234567890' },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'va.paid')
    assert.equal(event.data.id, 'va_456')
  })

  test('parses disbursement.completed event', ({ assert }) => {
    const payload = JSON.stringify({
      event: 'disbursement.completed',
      data: { id: 'disb_789', status: 'COMPLETED' },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'disbursement.completed')
  })

  test('parses ewallet.payment event', ({ assert }) => {
    const payload = JSON.stringify({
      event: 'ewallet.payment',
      data: { id: 'ewt_999', phone: '081234567890' },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'ewallet.payment')
  })

  test('parses unknown event type gracefully', ({ assert }) => {
    const payload = JSON.stringify({
      event: 'unknown.event',
      data: { id: 'unknown_123' },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'unknown.event')
    assert.deepEqual(event.data, { id: 'unknown_123' })
  })

  test('handles deeply nested data', ({ assert }) => {
    const payload = JSON.stringify({
      event: 'invoice.paid',
      data: {
        id: 'inv_123',
        customer: {
          name: 'John Doe',
          address: { city: 'Jakarta', country: 'ID' },
        },
        items: [
          { name: 'Item 1', price: 50000 },
          { name: 'Item 2', price: 50000 },
        ],
      },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'invoice.paid')
    assert.equal((event.data.customer as { name: string })?.name, 'John Doe')
    assert.lengthOf(event.data.items as unknown[], 2)
  })
})

test.group('XenditWebhook.parseEvent — flat payloads', () => {
  test('normalises flat QRIS PAID callback to payment.succeeded', ({ assert }) => {
    // Real Xendit QRIS webhook (truncated)
    const payload = JSON.stringify({
      id: '6a3ce3efeb98394332952257',
      external_id: 'PAY-MQT87Z82-13RW',
      status: 'PAID',
      payment_method: 'QR_CODE',
      amount: 850000,
      paid_amount: 850000,
      currency: 'IDR',
      payment_channel: 'QRIS',
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'payment.succeeded')
    assert.equal(event.data.external_id, 'PAY-MQT87Z82-13RW')
    assert.equal(event.data.status, 'PAID')
    assert.equal(event.data.amount, 850000)
  })

  test('normalises flat e-wallet SUCCEEDED callback to payment.succeeded', ({ assert }) => {
    const payload = JSON.stringify({
      id: 'ewc_123',
      external_id: 'order-123',
      status: 'SUCCEEDED',
      charge_amount: 50000,
      currency: 'IDR',
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'payment.succeeded')
    assert.equal(event.data.external_id, 'order-123')
  })

  test('normalises flat EXPIRED callback to payment.failed', ({ assert }) => {
    const payload = JSON.stringify({
      id: 'qr_123',
      external_id: 'order-456',
      status: 'EXPIRED',
      amount: 50000,
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'payment.failed')
    assert.equal(event.data.status, 'EXPIRED')
  })

  test('normalises flat FAILED callback to payment.failed', ({ assert }) => {
    const payload = JSON.stringify({
      id: 'ewc_999',
      external_id: 'order-789',
      status: 'FAILED',
      failure_code: 'EXPIRED_PAYMENT_REQUEST',
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'payment.failed')
    assert.equal(event.data.failure_code, 'EXPIRED_PAYMENT_REQUEST')
  })

  test('normalises flat disbursement completed callback', ({ assert }) => {
    const payload = JSON.stringify({
      id: 'disb_789',
      external_id: 'disb-123',
      status: 'COMPLETED',
      amount: 100000,
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'disbursement.completed')
    assert.equal(event.data.id, 'disb_789')
  })

  test('normalises flat disbursement failed callback', ({ assert }) => {
    const payload = JSON.stringify({
      id: 'disb_999',
      external_id: 'disb-456',
      status: 'FAILED',
      failure_code: 'TEMPORARY_NETWORK_ERROR',
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'disbursement.failed')
  })

  test('uses fallback event name for unrecognised flat payload', ({ assert }) => {
    const payload = JSON.stringify({
      id: 'unknown_123',
      external_id: 'order-999',
      status: 'PENDING',
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.event, 'payment.callback')
    assert.equal(event.data.external_id, 'order-999')
  })

  test('preserves all flat fields in data', ({ assert }) => {
    const payload = JSON.stringify({
      id: '6a3ce3efeb98394332952257',
      external_id: 'PAY-MQT87Z82-13RW',
      user_id: '6a3cb64868e76c0245572bb3',
      payment_method: 'QR_CODE',
      status: 'PAID',
      amount: 850000,
      paid_amount: 850000,
      paid_at: '2026-06-25T08:17:37.177Z',
      currency: 'IDR',
      payment_channel: 'QRIS',
      payment_details: { receipt_id: '48610536', source: 'DANA' },
    })

    const event = XenditWebhook.parseEvent(payload)
    assert.equal(event.data.user_id, '6a3cb64868e76c0245572bb3')
    assert.equal(event.data.paid_at, '2026-06-25T08:17:37.177Z')
    assert.deepEqual(event.data.payment_details, { receipt_id: '48610536', source: 'DANA' })
  })
})

test.group('XenditWebhook.parseEvent — error cases', () => {
  test('throws on invalid json', ({ assert }) => {
    assert.throws(() => XenditWebhook.parseEvent('not json'), SyntaxError)
  })

  test('throws on non-object payload (array)', ({ assert }) => {
    assert.throws(() => XenditWebhook.parseEvent(JSON.stringify([1, 2, 3])), TypeError)
  })

  test('throws on non-object payload (string)', ({ assert }) => {
    assert.throws(() => XenditWebhook.parseEvent(JSON.stringify('hello')), TypeError)
  })

  test('throws on null payload', ({ assert }) => {
    assert.throws(() => XenditWebhook.parseEvent(JSON.stringify(null)), TypeError)
  })
})
