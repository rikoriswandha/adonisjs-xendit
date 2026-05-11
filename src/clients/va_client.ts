import type { XenditHttpClient } from '../http_client.ts'
import type {
  CreateVirtualAccountRequest,
  UpdateVirtualAccountRequest,
  VirtualAccount,
  VAPayment,
} from '../types.ts'

export class VirtualAccountClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  create(data: CreateVirtualAccountRequest): Promise<VirtualAccount> {
    return this.#http.request<VirtualAccount>('POST', '/callback_virtual_accounts', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  getById(vaId: string): Promise<VirtualAccount> {
    return this.#http.request<VirtualAccount>('GET', `/callback_virtual_accounts/${vaId}`)
  }

  update(vaId: string, data: UpdateVirtualAccountRequest): Promise<VirtualAccount> {
    return this.#http.request<VirtualAccount>('PATCH', `/callback_virtual_accounts/${vaId}`, {
      body: data as unknown as Record<string, unknown>,
    })
  }

  getPayment(vaId: string): Promise<VAPayment> {
    return this.#http.request<VAPayment>('GET', `/callback_virtual_accounts/${vaId}/payments`)
  }
}
