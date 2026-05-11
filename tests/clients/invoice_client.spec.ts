import { test } from '@japa/runner'
import { InvoiceClient } from '../../src/clients/invoice_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'
import type { Invoice, CreateInvoiceRequest, ListInvoicesParams } from '../../src/types.ts'

class FakeHttpClient extends XenditHttpClient {
  requests: { method: string; path: string; options?: Record<string, unknown> }[] = []
  nextResponse: unknown = null
  nextError: Error | null = null

  constructor() {
    super({ baseUrl: 'https://api.xendit.co', secretKey: 'fake' })
  }

  override async request<T>(
    method: string,
    path: string,
    options?: Record<string, unknown>
  ): Promise<T> {
    this.requests.push({ method, path, options })
    if (this.nextError) {
      throw this.nextError
    }
    return this.nextResponse as T
  }
}

function sampleInvoice(): Invoice {
  return {
    id: 'inv_123',
    external_id: 'ext_123',
    user_id: 'user_123',
    status: 'PENDING',
    merchant_name: 'Test',
    merchant_profile_picture_url: '',
    amount: 100000,
    payer_email: 'test@example.com',
    description: 'Test invoice',
    invoice_url: 'https://checkout.xendit.co/inv_123',
    expiry_date: '2024-12-31T23:59:59.000Z',
    available_banks: [],
    available_retail_outlets: [],
    available_ewallets: [],
    available_qr_codes: [],
    available_direct_debits: [],
    available_paylaters: [],
    should_send_email: false,
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    currency: 'IDR',
  }
}

test.group('InvoiceClient', () => {
  test('create sends POST /v2/invoices with body', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = sampleInvoice()

    const client = new InvoiceClient(http)
    const payload: CreateInvoiceRequest = {
      external_id: 'order-1',
      amount: 50000,
      description: 'Payment for order #1',
    }

    const result = await client.create(payload)

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'POST')
    assert.equal(http.requests[0].path, '/v2/invoices')
    assert.deepEqual(http.requests[0].options?.body, payload)
    assert.equal(result.id, 'inv_123')
  })

  test('create passes idempotencyKey in options', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = sampleInvoice()

    const client = new InvoiceClient(http)
    const payload: CreateInvoiceRequest = {
      external_id: 'order-1',
      amount: 50000,
    }

    await client.create(payload, { idempotencyKey: 'idem-key-1' })

    assert.equal(http.requests[0].options?.idempotencyKey, 'idem-key-1')
  })

  test('getById sends GET /v2/invoices/:id', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = sampleInvoice()

    const client = new InvoiceClient(http)
    const result = await client.getById('inv_123')

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/v2/invoices/inv_123')
    assert.equal(result.id, 'inv_123')
  })

  test('list sends GET /v2/invoices without params', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = [sampleInvoice()]

    const client = new InvoiceClient(http)
    const result = await client.list()

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/v2/invoices')
    assert.equal(result.length, 1)
  })

  test('list sends GET /v2/invoices with query params', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = [sampleInvoice()]

    const client = new InvoiceClient(http)
    const params: ListInvoicesParams = {
      status: 'PAID',
      limit: 10,
      external_id: 'order-1',
    }

    await client.list(params)

    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/v2/invoices?status=PAID&limit=10&external_id=order-1')
  })

  test('list omits undefined/null params', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = []

    const client = new InvoiceClient(http)
    await client.list({
      status: 'PENDING',
      limit: undefined,
      external_id: null as unknown as string,
    })

    assert.equal(http.requests[0].path, '/v2/invoices?status=PENDING')
  })

  test('expire sends POST /invoices/:id/expire!', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = { ...sampleInvoice(), status: 'EXPIRED' }

    const client = new InvoiceClient(http)
    const result = await client.expire('inv_123')

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'POST')
    assert.equal(http.requests[0].path, '/invoices/inv_123/expire!')
    assert.equal(result.status, 'EXPIRED')
  })

  test('create propagates errors from http client', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextError = new Error('Network failure')

    const client = new InvoiceClient(http)
    await assert.rejects(
      () =>
        client.create({
          external_id: 'order-1',
          amount: 50000,
        }),
      'Network failure'
    )
  })

  test('getById propagates errors from http client', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextError = new Error('Not found')

    const client = new InvoiceClient(http)
    await assert.rejects(() => client.getById('bad-id'), 'Not found')
  })

  test('list propagates errors from http client', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextError = new Error('Server error')

    const client = new InvoiceClient(http)
    await assert.rejects(() => client.list(), 'Server error')
  })

  test('expire propagates errors from http client', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextError = new Error('Cannot expire')

    const client = new InvoiceClient(http)
    await assert.rejects(() => client.expire('inv_123'), 'Cannot expire')
  })
})
