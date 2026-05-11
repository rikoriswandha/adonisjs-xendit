import { test } from '@japa/runner'
import { XenditHttpClient } from '../../src/http_client.ts'
import { QrisClient } from '../../src/clients/qris_client.ts'
import type { CreateQRCodeRequest, SimulateQRCodeRequest } from '../../src/types.ts'

test.group('QrisClient', (group) => {
  let originalFetch: typeof fetch

  group.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.teardown(() => {
    globalThis.fetch = originalFetch
  })

  test('create() sends POST to /qr_codes', async ({ assert }) => {
    let capturedRequest!: Request
    let capturedBody!: string

    globalThis.fetch = async (_input, init) => {
      capturedRequest = new Request(_input as string, init)
      capturedBody = init?.body as string
      return new Response(
        JSON.stringify({
          id: 'qr_123',
          external_id: 'order-100',
          type: 'DYNAMIC',
          status: 'ACTIVE',
          amount: 25000,
          qr_string: '00020101021226660014ID...',
          callback_url: 'https://example.com/callback',
          currency: 'IDR',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new QrisClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_secret',
      })
    )

    const request: CreateQRCodeRequest = {
      external_id: 'order-100',
      type: 'DYNAMIC',
      amount: 25000,
      currency: 'IDR',
      callback_url: 'https://example.com/callback',
    }

    const result = await client.create(request)

    assert.equal(capturedRequest.method, 'POST')
    assert.ok(capturedRequest.url.endsWith('/qr_codes'))

    const body = JSON.parse(capturedBody)
    assert.equal(body.external_id, 'order-100')
    assert.equal(body.type, 'DYNAMIC')
    assert.equal(body.amount, 25000)
    assert.equal(body.currency, 'IDR')
    assert.equal(body.callback_url, 'https://example.com/callback')

    assert.equal(result.id, 'qr_123')
    assert.equal(result.type, 'DYNAMIC')
    assert.equal(result.status, 'ACTIVE')
    assert.equal(result.qr_string, '00020101021226660014ID...')
  })

  test('create() supports STATIC type without amount', async ({ assert }) => {
    let capturedBody!: string

    globalThis.fetch = async (_input, init) => {
      capturedBody = init?.body as string
      return new Response(
        JSON.stringify({
          id: 'qr_456',
          external_id: 'order-200',
          type: 'STATIC',
          status: 'ACTIVE',
          qr_string: '00020101021226660014ID...',
          currency: 'IDR',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new QrisClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_secret',
      })
    )

    const request: CreateQRCodeRequest = {
      external_id: 'order-200',
      type: 'STATIC',
      currency: 'IDR',
    }

    const result = await client.create(request)

    const body = JSON.parse(capturedBody)
    assert.equal(body.type, 'STATIC')
    assert.isUndefined(body.amount)

    assert.equal(result.id, 'qr_456')
    assert.equal(result.type, 'STATIC')
    assert.equal(result.qr_string, '00020101021226660014ID...')
  })

  test('getById() sends GET to /qr_codes/:id', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (_input, init) => {
      capturedRequest = new Request(_input as string, init)
      return new Response(
        JSON.stringify({
          id: 'qr_123',
          external_id: 'order-100',
          type: 'DYNAMIC',
          status: 'ACTIVE',
          amount: 25000,
          qr_string: '00020101021226660014ID...',
          currency: 'IDR',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new QrisClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_secret',
      })
    )

    const result = await client.getById('qr_123')

    assert.equal(capturedRequest.method, 'GET')
    assert.ok(capturedRequest.url.endsWith('/qr_codes/qr_123'))

    assert.equal(result.id, 'qr_123')
    assert.equal(result.status, 'ACTIVE')
    assert.equal(result.qr_string, '00020101021226660014ID...')
  })

  test('simulate() sends POST to /qr_codes/:id/payments/simulate', async ({ assert }) => {
    let capturedRequest!: Request
    let capturedBody!: string

    globalThis.fetch = async (_input, init) => {
      capturedRequest = new Request(_input as string, init)
      capturedBody = init?.body as string
      return new Response(
        JSON.stringify({
          id: 'qrp_123',
          external_id: 'order-100',
          amount: 25000,
          currency: 'IDR',
          qr_code: {
            id: 'qr_123',
            external_id: 'order-100',
            type: 'DYNAMIC',
            status: 'ACTIVE',
            amount: 25000,
            qr_string: '00020101021226660014ID...',
            currency: 'IDR',
            created: '2024-01-01T00:00:00.000Z',
            updated: '2024-01-01T00:00:00.000Z',
          },
          status: 'COMPLETED',
          payment_detail: {
            rrn: '1234567890',
            source: 'GOJEK',
          },
          created: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new QrisClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_secret',
      })
    )

    const request: SimulateQRCodeRequest = {
      amount: 25000,
    }

    const result = await client.simulate('qr_123', request)

    assert.equal(capturedRequest.method, 'POST')
    assert.ok(capturedRequest.url.endsWith('/qr_codes/qr_123/payments/simulate'))

    const body = JSON.parse(capturedBody)
    assert.equal(body.amount, 25000)

    assert.equal(result.id, 'qrp_123')
    assert.equal(result.status, 'COMPLETED')
    assert.equal(result.amount, 25000)
    assert.equal(result.qr_code.id, 'qr_123')
    assert.equal(result.payment_detail.rrn, '1234567890')
    assert.equal(result.payment_detail.source, 'GOJEK')
  })
})
