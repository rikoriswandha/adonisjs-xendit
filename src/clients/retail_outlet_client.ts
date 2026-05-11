import type { XenditHttpClient } from '../http_client.ts'
import type {
  CreateRetailOutletRequest,
  RetailOutlet,
  UpdateRetailOutletRequest,
} from '../types.ts'

export class RetailOutletClient {
  constructor(private readonly http: XenditHttpClient) {}

  create(data: CreateRetailOutletRequest): Promise<RetailOutlet> {
    return this.http.request<RetailOutlet>('POST', '/fixed_payment_code', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  getById(paymentId: string): Promise<RetailOutlet> {
    return this.http.request<RetailOutlet>('GET', `/fixed_payment_code/${paymentId}`)
  }

  update(paymentId: string, data: UpdateRetailOutletRequest): Promise<RetailOutlet> {
    return this.http.request<RetailOutlet>('PATCH', `/fixed_payment_code/${paymentId}`, {
      body: data as unknown as Record<string, unknown>,
    })
  }
}
