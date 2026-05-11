import { test } from '@japa/runner'
import { VirtualAccountClient } from '../../src/clients/va_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'
import type {
  CreateVirtualAccountRequest,
  UpdateVirtualAccountRequest,
  VirtualAccount,
  VAPayment,
  VirtualAccountChannelCode,
} from '../../src/types.ts'

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

function sampleVA(bankCode: VirtualAccountChannelCode = 'BCA'): VirtualAccount {
  return {
    id: 'va-123',
    external_id: 'ext-123',
    user_id: 'user-123',
    bank_code: bankCode,
    account_number: '1234567890',
    name: 'Test Customer',
    is_single_use: false,
    is_closed: false,
    status: 'ACTIVE',
    currency: 'IDR',
  }
}

function sampleVAPayment(): VAPayment {
  return {
    id: 'pay-123',
    payment_id: 'pay-id-123',
    business_id: 'biz-123',
    reference_id: 'ref-123',
    bank_code: 'BCA',
    account_number: '1234567890',
    currency: 'IDR',
    status: 'SETTLED',
    amount: 50000,
    paid_amount: 50000,
    paid_at: '2024-01-01T00:00:00.000Z',
    sender_name: 'John Doe',
    updated: '2024-01-01T00:00:00.000Z',
    created: '2024-01-01T00:00:00.000Z',
  }
}

test.group('VirtualAccountClient', () => {
  test('create sends POST to /callback_virtual_accounts with body', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = sampleVA('BCA')

    const client = new VirtualAccountClient(http)
    const payload: CreateVirtualAccountRequest = {
      external_id: 'order-1',
      bank_code: 'BCA',
      name: 'Test Customer',
      is_closed: true,
      expected_amount: 100000,
    }

    const result = await client.create(payload)

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'POST')
    assert.equal(http.requests[0].path, '/callback_virtual_accounts')
    assert.deepEqual(http.requests[0].options?.body, payload)
    assert.equal(result.id, 'va-123')
    assert.equal(result.bank_code, 'BCA')
  })

  test('create works with all supported bank codes', async ({ assert }) => {
    const banks: VirtualAccountChannelCode[] = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI']

    for (const bank of banks) {
      const http = new FakeHttpClient()
      http.nextResponse = sampleVA(bank)

      const client = new VirtualAccountClient(http)
      const payload: CreateVirtualAccountRequest = {
        external_id: `order-${bank}`,
        bank_code: bank,
        name: 'Test Customer',
      }

      const result = await client.create(payload)

      assert.equal(http.requests[0].method, 'POST')
      assert.equal(http.requests[0].path, '/callback_virtual_accounts')
      assert.deepEqual(http.requests[0].options?.body, payload)
      assert.equal(result.bank_code, bank)
    }
  })

  test('create supports closed VA with expected_amount', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = { ...sampleVA('BCA'), is_closed: true, expected_amount: 250000 }

    const client = new VirtualAccountClient(http)
    const payload: CreateVirtualAccountRequest = {
      external_id: 'closed-va-1',
      bank_code: 'MANDIRI',
      name: 'Closed VA Customer',
      is_closed: true,
      expected_amount: 250000,
    }

    const result = await client.create(payload)

    assert.equal(result.is_closed, true)
    assert.equal(result.expected_amount, 250000)
    assert.deepEqual(http.requests[0].options?.body, payload)
  })

  test('create supports open VA without expected_amount', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = { ...sampleVA('BNI'), is_closed: false }

    const client = new VirtualAccountClient(http)
    const payload: CreateVirtualAccountRequest = {
      external_id: 'open-va-1',
      bank_code: 'BNI',
      name: 'Open VA Customer',
      is_closed: false,
    }

    const result = await client.create(payload)

    assert.equal(result.is_closed, false)
    assert.isUndefined(result.expected_amount)
    assert.deepEqual(http.requests[0].options?.body, payload)
  })

  test('getById sends GET to /callback_virtual_accounts/:id', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = sampleVA('BRI')

    const client = new VirtualAccountClient(http)
    const result = await client.getById('va-123')

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/callback_virtual_accounts/va-123')
    assert.equal(result.id, 'va-123')
    assert.equal(result.bank_code, 'BRI')
  })

  test('update sends PATCH to /callback_virtual_accounts/:id with body', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = { ...sampleVA('PERMATA'), name: 'Updated Name', suggested_amount: 75000 }

    const client = new VirtualAccountClient(http)
    const payload: UpdateVirtualAccountRequest = {
      name: 'Updated Name',
      suggested_amount: 75000,
    }

    const result = await client.update('va-123', payload)

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'PATCH')
    assert.equal(http.requests[0].path, '/callback_virtual_accounts/va-123')
    assert.deepEqual(http.requests[0].options?.body, payload)
    assert.equal(result.name, 'Updated Name')
    assert.equal(result.suggested_amount, 75000)
  })

  test('update can change status to INACTIVE', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = { ...sampleVA('BSI'), status: 'INACTIVE' }

    const client = new VirtualAccountClient(http)
    const payload: UpdateVirtualAccountRequest = {
      status: 'INACTIVE',
    }

    const result = await client.update('va-456', payload)

    assert.equal(result.status, 'INACTIVE')
    assert.equal(http.requests[0].method, 'PATCH')
    assert.deepEqual(http.requests[0].options?.body, payload)
  })

  test('getPayment sends GET to /callback_virtual_accounts/:id/payments', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = sampleVAPayment()

    const client = new VirtualAccountClient(http)
    const result = await client.getPayment('va-123')

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/callback_virtual_accounts/va-123/payments')
    assert.equal(result.id, 'pay-123')
    assert.equal(result.status, 'SETTLED')
    assert.equal(result.amount, 50000)
  })

  test('propagates HTTP errors from the client', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextError = new Error('VA_NOT_FOUND')

    const client = new VirtualAccountClient(http)

    await assert.rejects(async () => {
      await client.getById('missing-id')
    }, /VA_NOT_FOUND/)

    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/callback_virtual_accounts/missing-id')
  })
})
