import { XenditHttpClient } from './http_client.ts'
import type { XenditConfig } from './types.ts'
import { BalanceClient } from './clients/balance_client.ts'
import { CreditCardClient } from './clients/credit_card_client.ts'
import { DirectDebitClient } from './clients/direct_debit_client.ts'
import { DisbursementClient } from './clients/disbursement_client.ts'
import { EWalletClient } from './clients/ewallet_client.ts'
import { InvoiceClient } from './clients/invoice_client.ts'
import { QrisClient } from './clients/qris_client.ts'
import { RetailOutletClient } from './clients/retail_outlet_client.ts'
import { VirtualAccountClient } from './clients/va_client.ts'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox-api.xendit.co',
  production: 'https://api.xendit.co',
}

export class XenditManager {
  readonly #http: XenditHttpClient
  readonly #clients = new Map<string, unknown>()

  constructor(config: XenditConfig) {
    const baseUrl = BASE_URLS[config.environment]

    this.#http = new XenditHttpClient({
      baseUrl,
      secretKey: config.secretKey,
      timeoutMs: config.timeoutMs,
    })
  }

  invoice(): InvoiceClient {
    return this.#cached('invoice', () => new InvoiceClient(this.#http))
  }

  va(): VirtualAccountClient {
    return this.#cached('va', () => new VirtualAccountClient(this.#http))
  }

  ewallet(): EWalletClient {
    return this.#cached('ewallet', () => new EWalletClient(this.#http))
  }

  qris(): QrisClient {
    return this.#cached('qris', () => new QrisClient(this.#http))
  }

  retailOutlet(): RetailOutletClient {
    return this.#cached('retailOutlet', () => new RetailOutletClient(this.#http))
  }

  creditCard(): CreditCardClient {
    return this.#cached('creditCard', () => new CreditCardClient(this.#http))
  }

  directDebit(): DirectDebitClient {
    return this.#cached('directDebit', () => new DirectDebitClient(this.#http))
  }

  disbursement(): DisbursementClient {
    return this.#cached('disbursement', () => new DisbursementClient(this.#http))
  }

  balance(): BalanceClient {
    return this.#cached('balance', () => new BalanceClient(this.#http))
  }

  #cached<T>(key: string, factory: () => T): T {
    if (!this.#clients.has(key)) {
      this.#clients.set(key, factory())
    }
    return this.#clients.get(key) as T
  }
}
