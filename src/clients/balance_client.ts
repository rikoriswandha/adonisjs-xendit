import type { XenditHttpClient } from '../http_client.ts'
import type { Balance, BalanceAccountType } from '../types.ts'

export class BalanceClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  get(): Promise<Balance> {
    return this.#http.request<Balance>('GET', '/balance')
  }

  getByAccountType(accountType: BalanceAccountType): Promise<Balance> {
    return this.#http.request<Balance>('GET', `/balance?account_type=${accountType}`)
  }
}
