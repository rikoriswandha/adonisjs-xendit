import { test } from '@japa/runner'
import { BalanceClient } from '../../src/clients/balance_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'

test.group('BalanceClient', (group) => {
  let originalFetch: typeof fetch

  group.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.teardown(() => {
    globalThis.fetch = originalFetch
  })

  function createClient() {
    const http = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_secret',
    })
    return new BalanceClient(http)
  }

  test('get() returns balance from GET /balance', async ({ assert }) => {
    globalThis.fetch = async (input, init) => {
      const req = new Request(input as string, init)
      assert.equal(req.method, 'GET')
      assert.equal(req.url, 'https://api.xendit.co/balance')

      return new Response(JSON.stringify({ balance: 1_000_000 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createClient()
    const result = await client.get()

    assert.equal(result.balance, 1_000_000)
    assert.isNumber(result.balance)
  })

  test('getByAccountType(CASH) returns balance with query param', async ({ assert }) => {
    globalThis.fetch = async (input, init) => {
      const req = new Request(input as string, init)
      assert.equal(req.method, 'GET')
      assert.equal(req.url, 'https://api.xendit.co/balance?account_type=CASH')

      return new Response(JSON.stringify({ balance: 500_000 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createClient()
    const result = await client.getByAccountType('CASH')

    assert.equal(result.balance, 500_000)
    assert.isNumber(result.balance)
  })

  test('getByAccountType(HOLDING) returns balance with query param', async ({ assert }) => {
    globalThis.fetch = async (input, init) => {
      const req = new Request(input as string, init)
      assert.equal(req.method, 'GET')
      assert.equal(req.url, 'https://api.xendit.co/balance?account_type=HOLDING')

      return new Response(JSON.stringify({ balance: 250_000 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createClient()
    const result = await client.getByAccountType('HOLDING')

    assert.equal(result.balance, 250_000)
  })

  test('getByAccountType(TAX) returns balance with query param', async ({ assert }) => {
    globalThis.fetch = async (input, init) => {
      const req = new Request(input as string, init)
      assert.equal(req.method, 'GET')
      assert.equal(req.url, 'https://api.xendit.co/balance?account_type=TAX')

      return new Response(JSON.stringify({ balance: 100_000 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createClient()
    const result = await client.getByAccountType('TAX')

    assert.equal(result.balance, 100_000)
  })

  test('get() sends Authorization header', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ balance: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = createClient()
    await client.get()

    const auth = capturedRequest.headers.get('Authorization')
    assert.equal(auth, `Basic ${Buffer.from('xnd_test_secret:').toString('base64')}`)
  })
})
