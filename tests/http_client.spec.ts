import { test } from '@japa/runner'
import { XenditHttpClient } from '../src/http_client.ts'
import {
  XenditAuthenticationError,
  XenditConflictError,
  XenditNetworkError,
  XenditNotFoundError,
  XenditRateLimitError,
  XenditServerError,
  XenditValidationError,
} from '../src/xendit_exception.ts'

function mockFetch(status: number, body: object, headers?: Record<string, string>): typeof fetch {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    })
}

function mockFetchNetworkError(): typeof fetch {
  return async () => {
    throw new Error('ECONNREFUSED')
  }
}

function mockFetchText(status: number, body: string): typeof fetch {
  return async () =>
    new Response(body, {
      status,
      headers: { 'content-type': 'text/plain' },
    })
}

test.group('XenditHttpClient', (group) => {
  let originalFetch: typeof fetch

  group.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.teardown(() => {
    globalThis.fetch = originalFetch
  })

  test('build auth header with base64 encoded secret key', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    await client.request('GET', '/v2/invoices/test')

    const auth = capturedRequest.headers.get('Authorization')
    assert.equal(auth, `Basic ${Buffer.from('xnd_test_123:').toString('base64')}`)
  })

  test('send tracking headers', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    await client.request('GET', '/v2/invoices/test')

    assert.equal(capturedRequest.headers.get('xendit-lib'), 'adonisjs')
    assert.equal(capturedRequest.headers.get('xendit-lib-ver'), '0.1.0')
  })

  test('send idempotency-key header when provided', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    await client.request('POST', '/v2/invoices', {
      idempotencyKey: 'idem-123',
    })

    assert.equal(capturedRequest.headers.get('idempotency-key'), 'idem-123')
  })

  test('do not send idempotency-key when not provided', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    await client.request('POST', '/v2/invoices')

    assert.isNull(capturedRequest.headers.get('idempotency-key'))
  })

  test('send custom headers merged with defaults', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    await client.request('GET', '/v2/invoices', {
      headers: { 'x-custom': 'value' },
    })

    assert.equal(capturedRequest.headers.get('x-custom'), 'value')
    assert.isNotNull(capturedRequest.headers.get('Authorization'))
    assert.isNotNull(capturedRequest.headers.get('xendit-lib'))
  })

  test('serialize body as JSON for POST', async ({ assert }) => {
    let capturedRequest!: Request
    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input as string, init)
      return new Response(JSON.stringify({ id: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    const body = { externalId: 'inv-123', amount: 10000 }
    await client.request('POST', '/v2/invoices', { body })

    const text = await capturedRequest.text()
    assert.deepEqual(JSON.parse(text), body)
  })

  test('parse JSON response body on success', async ({ assert }) => {
    globalThis.fetch = mockFetch(200, { id: 'inv-123', status: 'PENDING' })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    const result = await client.request('GET', '/v2/invoices/inv-123')
    assert.deepEqual(result, { id: 'inv-123', status: 'PENDING' })
  })

  test('map 400 to XenditValidationError', async ({ assert }) => {
    globalThis.fetch = mockFetch(400, {
      error_code: 'API_VALIDATION_ERROR',
      message: 'amount must be positive',
      errors: [{ path: 'amount', message: 'must be positive' }],
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('POST', '/v2/invoices', { body: { amount: -1 } })
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditValidationError)
      assert.equal(error.status, 400)
      assert.equal(error.code, 'API_VALIDATION_ERROR')
      assert.equal(error.message, 'amount must be positive')
      assert.deepEqual(error.rawResponse?.errors, [{ path: 'amount', message: 'must be positive' }])
    }
  })

  test('map 401 to XenditAuthenticationError', async ({ assert }) => {
    globalThis.fetch = mockFetch(401, {
      error_code: 'UNAUTHORIZED',
      message: 'Invalid API key',
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'bad_key',
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditAuthenticationError)
      assert.equal(error.status, 401)
      assert.equal(error.code, 'UNAUTHORIZED')
    }
  })

  test('map 404 to XenditNotFoundError', async ({ assert }) => {
    globalThis.fetch = mockFetch(404, {
      error_code: 'NOT_FOUND',
      message: 'Invoice not found',
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('GET', '/v2/invoices/missing')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditNotFoundError)
      assert.equal(error.status, 404)
      assert.equal(error.code, 'NOT_FOUND')
    }
  })

  test('map 409 to XenditConflictError', async ({ assert }) => {
    globalThis.fetch = mockFetch(409, {
      error_code: 'DUPLICATE_EXTERNAL_ID',
      message: 'External ID already used',
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('POST', '/v2/invoices', { body: { externalId: 'dup' } })
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditConflictError)
      assert.equal(error.status, 409)
      assert.equal(error.code, 'DUPLICATE_EXTERNAL_ID')
    }
  })

  test('map 429 to XenditRateLimitError', async ({ assert }) => {
    globalThis.fetch = mockFetch(429, {
      error_code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditRateLimitError)
      assert.equal(error.status, 429)
      assert.equal(error.code, 'RATE_LIMIT_EXCEEDED')
    }
  })

  test('map 500 to XenditServerError', async ({ assert }) => {
    globalThis.fetch = mockFetch(500, {
      error_code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditServerError)
      assert.equal(error.status, 500)
      assert.equal(error.code, 'INTERNAL_SERVER_ERROR')
    }
  })

  test('map 502 to XenditServerError', async ({ assert }) => {
    globalThis.fetch = mockFetch(502, {
      error_code: 'BAD_GATEWAY',
      message: 'Bad gateway',
    })

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditServerError)
      assert.equal(error.status, 500)
    }
  })

  test('handle non-JSON error response gracefully', async ({ assert }) => {
    globalThis.fetch = mockFetchText(500, 'Internal Server Error')

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditServerError)
      assert.equal(error.status, 500)
      assert.equal(error.code, 'UNKNOWN_ERROR')
      assert.equal(error.message, 'An error occurred')
      assert.isUndefined(error.rawResponse)
    }
  })

  test('handle network errors', async ({ assert }) => {
    globalThis.fetch = mockFetchNetworkError()

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditNetworkError)
      assert.equal(error.status, 0)
      assert.equal(error.code, 'NETWORK_ERROR')
      assert.include(error.message, 'ECONNREFUSED')
    }
  })

  test('handle timeout', async ({ assert }) => {
    globalThis.fetch = async (_input, init) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(
            new Response('{}', {
              status: 200,
              headers: { 'content-type': 'application/json' },
            })
          )
        }, 1000)

        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timeout)
          const err = new Error('The operation was aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
      timeoutMs: 50,
    })

    try {
      await client.request('GET', '/v2/invoices')
      assert.fail('should have thrown')
    } catch (error) {
      assert.instanceOf(error, XenditNetworkError)
      assert.equal(error.status, 0)
      assert.equal(error.code, 'TIMEOUT')
      assert.include(error.message, '50')
    }
  })

  test('strip trailing slash from baseUrl', async ({ assert }) => {
    let capturedUrl!: string
    globalThis.fetch = async (input) => {
      capturedUrl = input.toString()
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co/',
      secretKey: 'xnd_test_123',
    })

    await client.request('GET', '/v2/invoices')
    assert.equal(capturedUrl, 'https://api.xendit.co/v2/invoices')
  })

  test('use default timeout of 30s', async ({ assert }) => {
    let capturedInit: RequestInit | undefined
    globalThis.fetch = async (_input, init) => {
      capturedInit = init
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const client = new XenditHttpClient({
      baseUrl: 'https://api.xendit.co',
      secretKey: 'xnd_test_123',
    })

    await client.request('GET', '/v2/invoices')
    assert.isDefined(capturedInit?.signal)
  })
})
