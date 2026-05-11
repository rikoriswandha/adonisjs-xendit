import type { XenditHttpClient } from '../http_client.ts'
import type { CreateInvoiceRequest, Invoice, ListInvoicesParams } from '../types.ts'

export class InvoiceClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  create(data: CreateInvoiceRequest, options?: { idempotencyKey?: string }): Promise<Invoice> {
    return this.#http.request<Invoice>('POST', '/v2/invoices', {
      body: data as unknown as Record<string, unknown>,
      idempotencyKey: options?.idempotencyKey,
    })
  }

  getById(invoiceId: string): Promise<Invoice> {
    return this.#http.request<Invoice>('GET', `/v2/invoices/${invoiceId}`)
  }

  list(params?: ListInvoicesParams): Promise<Invoice[]> {
    const searchParams = new URLSearchParams()
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      }
    }
    const query = searchParams.toString()
    const path = query ? `/v2/invoices?${query}` : '/v2/invoices'
    return this.#http.request<Invoice[]>('GET', path)
  }

  expire(invoiceId: string): Promise<Invoice> {
    return this.#http.request<Invoice>('POST', `/invoices/${invoiceId}/expire!`)
  }
}
