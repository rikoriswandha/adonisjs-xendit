# adonisjs-xendit

AdonisJS v7 package for [Xendit](https://www.xendit.co/) payment gateway integration. Provides a typed, idiomatic wrapper around Xendit's API with support for invoices, virtual accounts, e-wallets, QRIS, retail outlets, credit cards, direct debit, disbursements, and balance queries.

## Features

- **9 Payment Products** — Invoice, Virtual Account, E-Wallet, QRIS, Retail Outlet, Credit Card, Direct Debit, Disbursement, Balance
- **Type-safe** — Full TypeScript types for all request/response shapes
- **IoC Container Integration** — `xendit.manager` singleton registered via provider
- **Webhook Helpers** — Built-in webhook payload parsing with callback token verification
- **Configurable** — `node ace configure` prompts for API key and generates config
- **Error Handling** — Custom `XenditException` with structured error responses

## Installation

```sh
npm install adonisjs-xendit
node ace configure adonisjs-xendit
```

The configure command will:
- Prompt for your Xendit secret key
- Generate `config/xendit.ts`
- Add `XENDIT_SECRET_KEY`, `XENDIT_ENVIRONMENT`, and `XENDIT_CALLBACK_TOKEN` to `.env`
- Register the provider in `adonisrc.ts`

## Configuration

```ts
// config/xendit.ts
import { defineConfig } from 'adonisjs-xendit'
import env from '#start/env'

export default defineConfig({
  secretKey: env.get('XENDIT_SECRET_KEY'),
  environment: env.get('XENDIT_ENVIRONMENT', 'sandbox'),
  callbackToken: env.get('XENDIT_CALLBACK_TOKEN'),
  timeoutMs: 30_000,
})
```

| Option | Required | Description |
|--------|----------|-------------|
| `secretKey` | Yes | Your Xendit API secret key |
| `environment` | Yes | `sandbox` or `production` |
| `callbackToken` | No | Token for webhook callback verification |
| `timeoutMs` | No | HTTP request timeout (default: 30000ms) |

## Usage

### Via IoC Container

```ts
import { inject } from '@adonisjs/core'
import type { XenditManager } from 'adonisjs-xendit'

@inject()
export default class PaymentsController {
  constructor(private xendit: XenditManager) {}

  async createInvoice() {
    const invoice = await this.xendit.invoice().create({
      external_id: 'order-123',
      amount: 50000,
      description: 'Test invoice',
      invoice_duration: 86400,
    })

    return invoice
  }
}
```

### Available Clients

```ts
const manager = new XenditManager(config)

manager.invoice()        // InvoiceClient
manager.va()             // VirtualAccountClient
manager.ewallet()        // EWalletClient
manager.qris()           // QrisClient
manager.retailOutlet()   // RetailOutletClient
manager.creditCard()     // CreditCardClient
manager.directDebit()    // DirectDebitClient
manager.disbursement()   // DisbursementClient
manager.balance()        // BalanceClient
```

### Webhook Handling

```ts
import { XenditWebhook } from 'adonisjs-xendit'

export default class WebhooksController {
  async handle(req: HttpContext) {
    const webhook = new XenditWebhook(callbackToken)

    // Verify callback token
    if (!webhook.verify(req.request.header('x-callback-token'))) {
      return req.response.forbidden('Invalid callback token')
    }

    // Validate and parse payload
    const payload = webhook.validate(req.request.all())
    
    // Process based on event type
    switch (payload.event) {
      case 'invoice.paid':
        // Handle paid invoice
        break
      case 'invoice.expired':
        // Handle expired invoice
        break
    }
  }
}
```

### Error Handling

```ts
import { XenditException } from 'adonisjs-xendit'

try {
  await xendit.invoice().create({ ... })
} catch (error) {
  if (error instanceof XenditException) {
    console.log(error.code)      // XENDIT_API_ERROR
    console.log(error.status)    // HTTP status code
    console.log(error.response)  // Full error response body
  }
}
```

## Exported Types

```ts
import type {
  XenditConfig,
  CreateInvoiceRequest,
  Invoice,
  CreateVirtualAccountRequest,
  CreateEWalletChargeRequest,
  // ... and more
} from 'adonisjs-xendit'
```

See `src/types.ts` for the complete type definitions.

## License

MIT
