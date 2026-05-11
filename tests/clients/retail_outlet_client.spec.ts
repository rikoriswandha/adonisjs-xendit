import { test } from '@japa/runner'
import { RetailOutletClient } from '../../src/clients/retail_outlet_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'

function mockFetch(status: number, body: object, headers?: Record<string, string>): typeof fetch {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    })
}

test.group('RetailOutletClient', (group) => {
  let originalFetch: typeof fetch

  group.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.teardown(() => {
    globalThis.fetch = originalFetch
  })

  test('create with ALFAMART outlet', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (_input, init) => {
      capturedRequest = new Request(_input as string, init)
      return new Response(
        JSON.stringify({
          id: 'test-id',
          external_id: 'ext-id',
          user_id: 'user-id',
          retail_outlet_name: 'ALFAMART',
          name: 'Test Payment',
          payment_code: 'ALFA123456',
          status: 'ACTIVE',
          is_single_use: true,
          currency: 'IDR',
          created: '2026-01-01T00:00:00Z',
          updated: '2026-01-01T00:00:00Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new RetailOutletClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_123',
      })
    )

    const result = await client.create({
      external_id: 'ext-id',
      retail_outlet_name: 'ALFAMART',
      name: 'Test Payment',
    })

    assert.equal(capturedRequest.method, 'POST')
    assert.equal(capturedRequest.url, 'https://api.xendit.co/fixed_payment_code')
    assert.equal(result.retail_outlet_name, 'ALFAMART')
    assert.equal(result.payment_code, 'ALFA123456')
    assert.equal(result.status, 'ACTIVE')
    assert.isTrue(result.is_single_use)
  })

  test('create with INDOMARET outlet and payment_code', async ({ assert }) => {
    let capturedBody: Record<string, unknown> | undefined

    globalThis.fetch = async (_input, init) => {
      capturedBody = init?.body ? JSON.parse(init.body as string) : undefined
      return new Response(
        JSON.stringify({
          id: 'test-id-2',
          external_id: 'ext-id-2',
          user_id: 'user-id',
          retail_outlet_name: 'INDOMARET',
          name: 'Indomaret Payment',
          payment_code: 'INDO654321',
          expected_amount: 50000,
          status: 'ACTIVE',
          is_single_use: true,
          currency: 'IDR',
          created: '2026-01-01T00:00:00Z',
          updated: '2026-01-01T00:00:00Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new RetailOutletClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_123',
      })
    )

    const result = await client.create({
      external_id: 'ext-id-2',
      retail_outlet_name: 'INDOMARET',
      name: 'Indomaret Payment',
      expected_amount: 50000,
      payment_code: 'CUSTOM123',
    })

    assert.equal(capturedBody?.payment_code, 'CUSTOM123')
    assert.equal(result.retail_outlet_name, 'INDOMARET')
    assert.equal(result.payment_code, 'INDO654321')
    assert.equal(result.expected_amount, 50000)
  })

  test('getById retrieves retail outlet', async ({ assert }) => {
    globalThis.fetch = mockFetch(200, {
      id: 'test-id-3',
      external_id: 'ext-id-3',
      user_id: 'user-id',
      retail_outlet_name: 'ALFAMART',
      name: 'Get Payment',
      payment_code: 'ALFA789012',
      status: 'ACTIVE',
      is_single_use: false,
      currency: 'IDR',
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-02T00:00:00Z',
    })

    const client = new RetailOutletClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_123',
      })
    )

    const result = await client.getById('test-id-3')

    assert.equal(result.id, 'test-id-3')
    assert.equal(result.external_id, 'ext-id-3')
    assert.equal(result.status, 'ACTIVE')
    assert.isFalse(result.is_single_use)
  })

  test('update modifies retail outlet', async ({ assert }) => {
    let capturedRequest!: Request
    let capturedBody: Record<string, unknown> | undefined

    globalThis.fetch = async (_input, init) => {
      capturedRequest = new Request(_input as string, init)
      capturedBody = init?.body ? JSON.parse(init.body as string) : undefined
      return new Response(
        JSON.stringify({
          id: 'test-id-4',
          external_id: 'ext-id-4',
          user_id: 'user-id',
          retail_outlet_name: 'INDOMARET',
          name: 'Updated Payment',
          payment_code: 'INDO111111',
          expected_amount: 75000,
          status: 'ACTIVE',
          is_single_use: true,
          expiration_date: '2026-12-31T23:59:59Z',
          description: 'Updated description',
          currency: 'IDR',
          created: '2026-01-01T00:00:00Z',
          updated: '2026-01-03T00:00:00Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new RetailOutletClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_123',
      })
    )

    const result = await client.update('test-id-4', {
      name: 'Updated Payment',
      expected_amount: 75000,
      expiration_date: '2026-12-31T23:59:59Z',
      description: 'Updated description',
      is_single_use: true,
    })

    assert.equal(capturedRequest.method, 'PATCH')
    assert.equal(capturedRequest.url, 'https://api.xendit.co/fixed_payment_code/test-id-4')
    assert.equal(capturedBody?.name, 'Updated Payment')
    assert.equal(capturedBody?.expected_amount, 75000)
    assert.equal(capturedBody?.expiration_date, '2026-12-31T23:59:59Z')
    assert.equal(capturedBody?.description, 'Updated description')
    assert.equal(capturedBody?.status, undefined)
    assert.equal(result.name, 'Updated Payment')
    assert.equal(result.expected_amount, 75000)
  })

  test('update with status change', async ({ assert }) => {
    let capturedBody: Record<string, unknown> | undefined

    globalThis.fetch = async (_input, init) => {
      capturedBody = init?.body ? JSON.parse(init.body as string) : undefined
      return new Response(
        JSON.stringify({
          id: 'test-id-5',
          external_id: 'ext-id-5',
          user_id: 'user-id',
          retail_outlet_name: 'ALFAMART',
          name: 'Deactivated Payment',
          payment_code: 'ALFA000000',
          status: 'INACTIVE',
          is_single_use: true,
          currency: 'IDR',
          created: '2026-01-01T00:00:00Z',
          updated: '2026-01-04T00:00:00Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new RetailOutletClient(
      new XenditHttpClient({
        baseUrl: 'https://api.xendit.co',
        secretKey: 'xnd_test_123',
      })
    )

    const result = await client.update('test-id-5', {
      status: 'INACTIVE',
    })

    assert.equal(capturedBody?.status, 'INACTIVE')
    assert.equal(result.status, 'INACTIVE')
  })
})
