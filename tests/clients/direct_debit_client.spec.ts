import { test } from '@japa/runner'
import { DirectDebitClient } from '../../src/clients/direct_debit_client.ts'
import { XenditHttpClient } from '../../src/http_client.ts'
import type {
  DirectDebitPaymentMethod,
  DirectDebitPayment,
  CreateDirectDebitPaymentMethodRequest,
  ValidateDirectDebitOTPRequest,
  CreateDirectDebitPaymentRequest,
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

function samplePaymentMethod(): DirectDebitPaymentMethod {
  return {
    id: 'pm_dd_123',
    business_id: 'biz_123',
    reference_id: 'ref_123',
    customer_id: 'cust_123',
    status: 'PENDING',
    channel_code: 'BRI',
    properties: { account_number: '1234567890' },
    metadata: { source: 'test' },
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
  }
}

function samplePayment(): DirectDebitPayment {
  return {
    id: 'pay_dd_123',
    reference_id: 'ref_pay_123',
    business_id: 'biz_123',
    currency: 'IDR',
    amount: 100000,
    country: 'ID',
    status: 'PENDING',
    payment_method_id: 'pm_dd_123',
    channel_code: 'BRI',
    description: 'Test payment',
    callback_url: 'https://example.com/callback',
    enable_otp: true,
    metadata: { order_id: 'order-1' },
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
  }
}

test.group('DirectDebitClient', () => {
  test('createPaymentMethod sends POST /direct_debit/payment_methods with body', async ({
    assert,
  }) => {
    const http = new FakeHttpClient()
    http.nextResponse = samplePaymentMethod()

    const client = new DirectDebitClient(http)
    const payload: CreateDirectDebitPaymentMethodRequest = {
      customer_id: 'cust_123',
      channel_code: 'BRI',
      properties: { account_number: '1234567890' },
    }

    const result = await client.createPaymentMethod(payload)

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'POST')
    assert.equal(http.requests[0].path, '/direct_debit/payment_methods')
    assert.deepEqual(http.requests[0].options?.body, payload)
    assert.equal(result.id, 'pm_dd_123')
    assert.equal(result.status, 'PENDING')
  })

  test('validateOTP sends POST to validate endpoint with paymentMethodId', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = { ...samplePaymentMethod(), status: 'ACTIVE' }

    const client = new DirectDebitClient(http)
    const payload: ValidateDirectDebitOTPRequest = {
      otp_code: '123456',
    }

    const result = await client.validateOTP('pm_dd_123', payload)

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'POST')
    assert.equal(http.requests[0].path, '/direct_debit/payment_methods/pm_dd_123/validate')
    assert.deepEqual(http.requests[0].options?.body, payload)
    assert.equal(result.status, 'ACTIVE')
  })

  test('createPayment sends POST /direct_debit/payments with body', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = samplePayment()

    const client = new DirectDebitClient(http)
    const payload: CreateDirectDebitPaymentRequest = {
      reference_id: 'ref_pay_123',
      payment_method_id: 'pm_dd_123',
      currency: 'IDR',
      amount: 100000,
      enable_otp: true,
    }

    const result = await client.createPayment(payload)

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'POST')
    assert.equal(http.requests[0].path, '/direct_debit/payments')
    assert.deepEqual(http.requests[0].options?.body, payload)
    assert.equal(result.id, 'pay_dd_123')
    assert.equal(result.status, 'PENDING')
  })

  test('getPayment sends GET to payment endpoint with paymentId', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextResponse = samplePayment()

    const client = new DirectDebitClient(http)
    const result = await client.getPayment('pay_dd_123')

    assert.equal(http.requests.length, 1)
    assert.equal(http.requests[0].method, 'GET')
    assert.equal(http.requests[0].path, '/direct_debit/payments/pay_dd_123')
    assert.equal(result.id, 'pay_dd_123')
    assert.equal(result.status, 'PENDING')
  })

  test('payment method linking flow: create -> validate -> createPayment', async ({ assert }) => {
    const http = new FakeHttpClient()
    const client = new DirectDebitClient(http)

    http.nextResponse = samplePaymentMethod()
    const createMethodPayload: CreateDirectDebitPaymentMethodRequest = {
      customer_id: 'cust_123',
      channel_code: 'BRI',
    }
    const method = await client.createPaymentMethod(createMethodPayload)
    assert.equal(method.status, 'PENDING')

    http.nextResponse = { ...samplePaymentMethod(), status: 'ACTIVE' }
    const validatePayload: ValidateDirectDebitOTPRequest = { otp_code: '123456' }
    const validatedMethod = await client.validateOTP(method.id, validatePayload)
    assert.equal(validatedMethod.status, 'ACTIVE')

    http.nextResponse = samplePayment()
    const paymentPayload: CreateDirectDebitPaymentRequest = {
      reference_id: 'ref_pay_123',
      payment_method_id: validatedMethod.id,
      currency: 'IDR',
      amount: 100000,
    }
    const payment = await client.createPayment(paymentPayload)
    assert.equal(payment.payment_method_id, method.id)
    assert.equal(payment.status, 'PENDING')

    assert.equal(http.requests.length, 3)
    assert.equal(http.requests[0].path, '/direct_debit/payment_methods')
    assert.equal(http.requests[1].path, '/direct_debit/payment_methods/pm_dd_123/validate')
    assert.equal(http.requests[2].path, '/direct_debit/payments')
  })

  test('propagates HTTP errors', async ({ assert }) => {
    const http = new FakeHttpClient()
    http.nextError = new Error('Network failure')

    const client = new DirectDebitClient(http)
    const payload: CreateDirectDebitPaymentRequest = {
      reference_id: 'ref_pay_123',
      payment_method_id: 'pm_dd_123',
      currency: 'IDR',
      amount: 100000,
    }

    await assert.rejects(() => client.createPayment(payload), 'Network failure')
  })
})
