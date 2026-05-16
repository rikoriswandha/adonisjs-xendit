import { test } from '@japa/runner'
import crypto from 'node:crypto'
import { XenditWebhook } from '../src/webhook.ts'

test.group('XenditWebhook.verify', () => {
  const callbackToken = 'supersecretcallbacktoken'
  const payload = JSON.stringify({ event: 'invoice.paid', data: { id: 'inv_123' } })

  test('returns true for valid signature', ({ assert }) => {
    const signature = crypto.createHmac('sha256', callbackToken).update(payload).digest('hex')

    const result = XenditWebhook.verify(payload, callbackToken, signature)
    assert.isTrue(result)
  })

  test('returns false for invalid signature', ({ assert }) => {
    const signature = 'invalidsignature1234567890abcdef1234567890abcdef1234567890abcdef1234'

    const result = XenditWebhook.verify(payload, callbackToken, signature)
    assert.isFalse(result)
  })

  test('returns false for wrong callback token', ({ assert }) => {
    const signature = crypto.createHmac('sha256', callbackToken).update(payload).digest('hex')

    const result = XenditWebhook.verify(payload, 'wrongtoken', signature)
    assert.isFalse(result)
  })

  test('returns false for tampered payload', ({ assert }) => {
    const signature = crypto.createHmac('sha256', callbackToken).update(payload).digest('hex')
    const tamperedPayload = JSON.stringify({ event: 'invoice.paid', data: { id: 'inv_999' } })

    const result = XenditWebhook.verify(tamperedPayload, callbackToken, signature)
    assert.isFalse(result)
  })

  test('returns false when signature length differs', ({ assert }) => {
    const result = XenditWebhook.verify(payload, callbackToken, 'short')
    assert.isFalse(result)
  })

  test('handles unicode payload correctly', ({ assert }) => {
    const unicodePayload = JSON.stringify({
      event: 'invoice.paid',
      data: { name: 'Rupiah: Rp 100.000' },
    })
    const signature = crypto
      .createHmac('sha256', callbackToken)
      .update(unicodePayload)
      .digest('hex')

    const result = XenditWebhook.verify(unicodePayload, callbackToken, signature)
    assert.isTrue(result)
  })
})

test.group('XenditWebhook.parseEvent', () => {
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

  test('throws on invalid json', ({ assert }) => {
    assert.throws(() => XenditWebhook.parseEvent('not json'), SyntaxError)
  })

  test('throws on invalid webhook shape', ({ assert }) => {
    assert.throws(
      () => XenditWebhook.parseEvent(JSON.stringify({ data: { id: 'inv_123' } })),
      TypeError
    )
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
