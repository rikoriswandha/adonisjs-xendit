import type { XenditHttpClient } from '../http_client.ts'
import type { CreateEWalletChargeRequest, EWalletCharge, EWalletChannelCode } from '../types.ts'

export class EWalletClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  createOvo(data: CreateEWalletChargeRequest): Promise<EWalletCharge> {
    return this.#createCharge(data, 'ID_OVO')
  }

  createDana(data: CreateEWalletChargeRequest): Promise<EWalletCharge> {
    return this.#createCharge(data, 'ID_DANA')
  }

  createLinkAja(data: CreateEWalletChargeRequest): Promise<EWalletCharge> {
    return this.#createCharge(data, 'ID_LINKAJA')
  }

  createShopeepay(data: CreateEWalletChargeRequest): Promise<EWalletCharge> {
    return this.#createCharge(data, 'ID_SHOPEEPAY')
  }

  getStatus(chargeId: string): Promise<EWalletCharge> {
    return this.#http.request<EWalletCharge>('GET', `/ewallets/charges/${chargeId}`)
  }

  #createCharge(
    data: CreateEWalletChargeRequest,
    channelCode: EWalletChannelCode
  ): Promise<EWalletCharge> {
    return this.#http.request<EWalletCharge>('POST', '/ewallets/charges', {
      body: { ...data, channel_code: channelCode } as Record<string, unknown>,
    })
  }
}
