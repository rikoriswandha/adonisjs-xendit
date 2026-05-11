import { test } from '@japa/runner'
import { DisbursementClient } from '../../src/clients/disbursement_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'

test.group('DisbursementClient', (group) => {
  let originalFetch: typeof fetch
  let client: DisbursementClient

  group.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.teardown(() => {
    globalThis.fetch = originalFetch
  })

  group.each.setup(() => {
    const http = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_secret',
    })
    client = new DisbursementClient(http)
  })

  test('create sends POST to /disbursements with request body', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(
        JSON.stringify({
          id: 'disb-123',
          user_id: 'user-123',
          external_id: 'ext-123',
          amount: 100000,
          bank_code: 'BCA',
          account_holder_name: 'John Doe',
          account_number: '1234567890',
          status: 'PENDING',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const result = await client.create({
      external_id: 'ext-123',
      amount: 100000,
      bank_code: 'BCA',
      account_holder_name: 'John Doe',
      account_number: '1234567890',
    })

    assert.equal(capturedRequest.method, 'POST')
    assert.equal(capturedRequest.url, 'https://api.xendit.co/disbursements')
    const body = (await capturedRequest.json()) as Record<string, unknown>
    assert.equal(body.external_id, 'ext-123')
    assert.equal(body.amount, 100000)
    assert.equal(body.bank_code, 'BCA')
    assert.equal(body.account_holder_name, 'John Doe')
    assert.equal(body.account_number, '1234567890')

    assert.equal(result.id, 'disb-123')
    assert.equal(result.status, 'PENDING')
    assert.equal(result.amount, 100000)
  })

  test('create sends idempotency-key header when provided', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(
        JSON.stringify({
          id: 'disb-123',
          user_id: 'user-123',
          external_id: 'ext-123',
          amount: 100000,
          bank_code: 'BCA',
          account_holder_name: 'John Doe',
          account_number: '1234567890',
          status: 'PENDING',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    await client.create(
      {
        external_id: 'ext-123',
        amount: 100000,
        bank_code: 'BCA',
        account_holder_name: 'John Doe',
        account_number: '1234567890',
      },
      { idempotencyKey: 'idem-abc' }
    )

    assert.equal(capturedRequest.headers.get('idempotency-key'), 'idem-abc')
  })

  test('getById sends GET to /disbursements/:id', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(
        JSON.stringify({
          id: 'disb-123',
          user_id: 'user-123',
          external_id: 'ext-123',
          amount: 100000,
          bank_code: 'BCA',
          account_holder_name: 'John Doe',
          account_number: '1234567890',
          status: 'SUCCEEDED',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const result = await client.getById('disb-123')

    assert.equal(capturedRequest.method, 'GET')
    assert.equal(capturedRequest.url, 'https://api.xendit.co/disbursements/disb-123')
    assert.equal(result.id, 'disb-123')
    assert.equal(result.status, 'SUCCEEDED')
  })

  test('createBatch sends POST to /batch_disbursements with body', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(
        JSON.stringify({
          id: 'batch-123',
          reference: 'batch-ref',
          total_disbursed_amount: 100000,
          total_uploaded_amount: 100000,
          status: 'PENDING',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const result = await client.createBatch({
      reference: 'batch-ref',
      disbursements: [
        {
          external_id: 'ext-1',
          amount: 50000,
          bank_code: 'BCA',
          account_holder_name: 'Alice',
          account_number: '1111111111',
        },
        {
          external_id: 'ext-2',
          amount: 50000,
          bank_code: 'BNI',
          account_holder_name: 'Bob',
          account_number: '2222222222',
        },
      ],
    })

    assert.equal(capturedRequest.method, 'POST')
    assert.equal(capturedRequest.url, 'https://api.xendit.co/batch_disbursements')
    const body = (await capturedRequest.json()) as Record<string, unknown>
    assert.equal(body.reference, 'batch-ref')
    const disbursements = body.disbursements as Record<string, unknown>[]
    assert.lengthOf(disbursements, 2)
    assert.equal(disbursements[0].external_id, 'ext-1')
    assert.equal(disbursements[1].bank_code, 'BNI')

    assert.equal(result.id, 'batch-123')
    assert.equal(result.reference, 'batch-ref')
    assert.equal(result.status, 'PENDING')
  })

  test('createBatch sends idempotency-key header when provided', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(
        JSON.stringify({
          id: 'batch-123',
          reference: 'batch-ref',
          total_disbursed_amount: 100000,
          total_uploaded_amount: 100000,
          status: 'PENDING',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    await client.createBatch(
      {
        reference: 'batch-ref',
        disbursements: [],
      },
      { idempotencyKey: 'idem-batch' }
    )

    assert.equal(capturedRequest.headers.get('idempotency-key'), 'idem-batch')
  })

  test('getAvailableBanks sends GET and returns banks with can_disburse', async ({ assert }) => {
    let capturedRequest!: Request

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(
        JSON.stringify([
          { name: 'Bank Central Asia', code: 'BCA', can_disburse: true },
          { name: 'Bank Negara Indonesia', code: 'BNI', can_disburse: true },
          { name: 'Bank Rakyat Indonesia', code: 'BRI', can_disburse: false },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const result = await client.getAvailableBanks()

    assert.equal(capturedRequest.method, 'GET')
    assert.equal(capturedRequest.url, 'https://api.xendit.co/available_disbursements_banks')
    assert.lengthOf(result, 3)
    assert.equal(result[0].name, 'Bank Central Asia')
    assert.equal(result[0].code, 'BCA')
    assert.isTrue(result[0].can_disburse)
    assert.equal(result[2].code, 'BRI')
    assert.isFalse(result[2].can_disburse)
  })
})
