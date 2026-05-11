import { test } from '@japa/runner'
import { EWalletClient } from '../../src/clients/ewallet_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'
import type { CreateEWalletChargeRequest, EWalletCharge } from '../../src/types.ts'

test.group('EWalletClient', (group) => {
  let originalFetch: typeof fetch

  group.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.teardown(() => {
    globalThis.fetch = originalFetch
  })

  function makeClient(): {
    client: EWalletClient
    lastRequest: { url?: string; method?: string; body?: object }
  } {
    const http = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })
    const lastRequest: { url?: string; method?: string; body?: object } = {}

    globalThis.fetch = async (input, init) => {
      const req = new Request(input as string, init)
      lastRequest.url = req.url
      lastRequest.method = req.method
      lastRequest.body = req.body ? JSON.parse(await req.text()) : undefined

      return new Response(
        JSON.stringify({
          id: 'ewc_test_123',
          business_id: 'biz_123',
          reference_id: 'ref_123',
          status: 'PENDING',
          currency: 'IDR',
          charge_amount: 10000,
          channel_code: 'ID_OVO',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        } as EWalletCharge),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    return { client: new EWalletClient(http), lastRequest }
  }

  test('createOvo sends POST to /ewallets/charges with ID_OVO channel code', async ({ assert }) => {
    const { client, lastRequest } = makeClient()
    const data: CreateEWalletChargeRequest = {
      reference_id: 'ref_ovo_123',
      currency: 'IDR',
      amount: 10000,
      channel_code: 'ID_OVO',
    }

    await client.createOvo(data)

    assert.equal(lastRequest.method, 'POST')
    assert.include(lastRequest.url, '/ewallets/charges')
    assert.deepEqual(lastRequest.body, { ...data, channel_code: 'ID_OVO' })
  })

  test('createDana sends POST to /ewallets/charges with ID_DANA channel code', async ({
    assert,
  }) => {
    const { client, lastRequest } = makeClient()
    const data: CreateEWalletChargeRequest = {
      reference_id: 'ref_dana_123',
      currency: 'IDR',
      amount: 20000,
      channel_code: 'ID_DANA',
    }

    await client.createDana(data)

    assert.equal(lastRequest.method, 'POST')
    assert.include(lastRequest.url, '/ewallets/charges')
    assert.deepEqual(lastRequest.body, { ...data, channel_code: 'ID_DANA' })
  })

  test('createLinkAja sends POST to /ewallets/charges with ID_LINKAJA channel code', async ({
    assert,
  }) => {
    const { client, lastRequest } = makeClient()
    const data: CreateEWalletChargeRequest = {
      reference_id: 'ref_linkaja_123',
      currency: 'IDR',
      amount: 30000,
      channel_code: 'ID_LINKAJA',
    }

    await client.createLinkAja(data)

    assert.equal(lastRequest.method, 'POST')
    assert.include(lastRequest.url, '/ewallets/charges')
    assert.deepEqual(lastRequest.body, { ...data, channel_code: 'ID_LINKAJA' })
  })

  test('createShopeepay sends POST to /ewallets/charges with ID_SHOPEEPAY channel code', async ({
    assert,
  }) => {
    const { client, lastRequest } = makeClient()
    const data: CreateEWalletChargeRequest = {
      reference_id: 'ref_shopeepay_123',
      currency: 'IDR',
      amount: 40000,
      channel_code: 'ID_SHOPEEPAY',
    }

    await client.createShopeepay(data)

    assert.equal(lastRequest.method, 'POST')
    assert.include(lastRequest.url, '/ewallets/charges')
    assert.deepEqual(lastRequest.body, { ...data, channel_code: 'ID_SHOPEEPAY' })
  })

  test('create methods override channel_code in request body', async ({ assert }) => {
    const { client, lastRequest } = makeClient()
    const data: CreateEWalletChargeRequest = {
      reference_id: 'ref_123',
      currency: 'IDR',
      amount: 10000,
      channel_code: 'ID_DANA',
    }

    await client.createOvo(data)

    assert.equal((lastRequest.body as any).channel_code, 'ID_OVO')
  })

  test('getStatus sends GET to /ewallets/charges/:id', async ({ assert }) => {
    const { client, lastRequest } = makeClient()

    const result = await client.getStatus('ewc_test_123')

    assert.equal(lastRequest.method, 'GET')
    assert.include(lastRequest.url, '/ewallets/charges/ewc_test_123')
    assert.equal(result.id, 'ewc_test_123')
    assert.equal(result.status, 'PENDING')
  })

  test('create methods return EWalletCharge with checkout_url when present', async ({ assert }) => {
    const http = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          id: 'ewc_test_123',
          business_id: 'biz_123',
          reference_id: 'ref_123',
          status: 'PENDING',
          currency: 'IDR',
          charge_amount: 10000,
          channel_code: 'ID_OVO',
          actions: [{ name: 'CHECKOUT_URL', method: 'GET', url: 'https://checkout.xendit.co/123' }],
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        } as EWalletCharge),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )

    const client = new EWalletClient(http)
    const result = await client.createOvo({
      reference_id: 'ref_123',
      currency: 'IDR',
      amount: 10000,
      channel_code: 'ID_OVO',
    })

    assert.equal(result.actions?.[0].name, 'CHECKOUT_URL')
    assert.equal(result.actions?.[0].url, 'https://checkout.xendit.co/123')
  })

  test('status polling via getStatus returns updated status', async ({ assert }) => {
    const http = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    let callCount = 0
    globalThis.fetch = async () => {
      callCount++
      const status = callCount === 1 ? 'PENDING' : 'SUCCEEDED'
      return new Response(
        JSON.stringify({
          id: 'ewc_test_123',
          business_id: 'biz_123',
          reference_id: 'ref_123',
          status,
          currency: 'IDR',
          charge_amount: 10000,
          channel_code: 'ID_OVO',
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-01T00:00:00.000Z',
        } as EWalletCharge),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    const client = new EWalletClient(http)

    const first = await client.getStatus('ewc_test_123')
    assert.equal(first.status, 'PENDING')

    const second = await client.getStatus('ewc_test_123')
    assert.equal(second.status, 'SUCCEEDED')
    assert.equal(callCount, 2)
  })
})
