import type { XenditHttpClient } from '../http_client.ts'
import type {
  CreateCreditCardAuthRequest,
  CreditCardAuth,
  CreateCreditCardChargeRequest,
  CreditCardCharge,
  CreateCreditCardRefundRequest,
  CreditCardRefund,
} from '../types.ts'

export class CreditCardClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  async createAuthorization(data: CreateCreditCardAuthRequest): Promise<CreditCardAuth> {
    return this.#http.request<CreditCardAuth>('POST', '/credit_card_charges/auth', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  async createCharge(data: CreateCreditCardChargeRequest): Promise<CreditCardCharge> {
    return this.#http.request<CreditCardCharge>('POST', '/credit_card_charges', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  async createRefund(
    chargeId: string,
    data: CreateCreditCardRefundRequest
  ): Promise<CreditCardRefund> {
    return this.#http.request<CreditCardRefund>(
      'POST',
      `/credit_card_charges/${chargeId}/refunds`,
      {
        body: data as unknown as Record<string, unknown>,
      }
    )
  }

  async getCharge(chargeId: string): Promise<CreditCardCharge> {
    return this.#http.request<CreditCardCharge>('GET', `/credit_card_charges/${chargeId}`)
  }
}
