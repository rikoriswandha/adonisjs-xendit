import type { XenditHttpClient } from '../http_client.ts'
import type { CreateQRCodeRequest, QRCode, QRCodePayment, SimulateQRCodeRequest } from '../types.ts'

export class QrisClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  create(data: CreateQRCodeRequest): Promise<QRCode> {
    return this.#http.request<QRCode>('POST', '/qr_codes', {
      body: data as unknown as Record<string, unknown>,
    })
  }

  getById(qrId: string): Promise<QRCode> {
    return this.#http.request<QRCode>('GET', `/qr_codes/${qrId}`)
  }

  simulate(qrId: string, data: SimulateQRCodeRequest): Promise<QRCodePayment> {
    return this.#http.request<QRCodePayment>('POST', `/qr_codes/${qrId}/payments/simulate`, {
      body: data as unknown as Record<string, unknown>,
    })
  }
}
