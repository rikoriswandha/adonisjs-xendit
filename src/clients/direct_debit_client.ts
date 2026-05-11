import type { XenditHttpClient } from '../http_client.ts'
import type {
  CreateDirectDebitPaymentMethodRequest,
  ValidateDirectDebitOTPRequest,
  DirectDebitPaymentMethod,
  CreateDirectDebitPaymentRequest,
  DirectDebitPayment,
} from '../types.ts'

export class DirectDebitClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  createPaymentMethod(
    data: CreateDirectDebitPaymentMethodRequest
  ): Promise<DirectDebitPaymentMethod> {
    return this.#http.request<DirectDebitPaymentMethod>('POST', '/direct_debit/payment_methods', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  validateOTP(
    paymentMethodId: string,
    data: ValidateDirectDebitOTPRequest
  ): Promise<DirectDebitPaymentMethod> {
    return this.#http.request<DirectDebitPaymentMethod>(
      'POST',
      `/direct_debit/payment_methods/${paymentMethodId}/validate`,
      {
        body: data as unknown as Record<string, unknown>,
      }
    )
  }

  createPayment(data: CreateDirectDebitPaymentRequest): Promise<DirectDebitPayment> {
    return this.#http.request<DirectDebitPayment>('POST', '/direct_debit/payments', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  getPayment(paymentId: string): Promise<DirectDebitPayment> {
    return this.#http.request<DirectDebitPayment>('GET', `/direct_debit/payments/${paymentId}`)
  }
}
