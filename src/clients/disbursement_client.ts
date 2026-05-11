import type { XenditHttpClient, XenditRequestOptions } from '../http_client.ts'
import type {
  BatchDisbursement,
  CreateBatchDisbursementRequest,
  CreateDisbursementRequest,
  Disbursement,
  DisbursementBank,
} from '../types.ts'

export class DisbursementClient {
  readonly #http: XenditHttpClient

  constructor(http: XenditHttpClient) {
    this.#http = http
  }

  create(
    data: CreateDisbursementRequest,
    options?: Pick<XenditRequestOptions, 'idempotencyKey'>
  ): Promise<Disbursement> {
    return this.#http.request<Disbursement>('POST', '/disbursements', {
      body: data as unknown as Record<string, unknown>,
      idempotencyKey: options?.idempotencyKey,
    })
  }

  getById(disbursementId: string): Promise<Disbursement> {
    return this.#http.request<Disbursement>('GET', `/disbursements/${disbursementId}`)
  }

  createBatch(
    data: CreateBatchDisbursementRequest,
    options?: Pick<XenditRequestOptions, 'idempotencyKey'>
  ): Promise<BatchDisbursement> {
    return this.#http.request<BatchDisbursement>('POST', '/batch_disbursements', {
      body: data as unknown as Record<string, unknown>,
      idempotencyKey: options?.idempotencyKey,
    })
  }

  getAvailableBanks(): Promise<DisbursementBank[]> {
    return this.#http.request<DisbursementBank[]>('GET', '/available_disbursements_banks')
  }
}
