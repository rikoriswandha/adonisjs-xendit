# @rikology/adonisjs-xendit

[![npm version](https://img.shields.io/npm/v/@rikology/adonisjs-xendit.svg?style=flat-square)](https://www.npmjs.com/package/@rikology/adonisjs-xendit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/)
[![AdonisJS Version](https://img.shields.io/badge/AdonisJS-v7-blue.svg?style=flat-square)](https://adonisjs.com/)

AdonisJS v7 package for [Xendit](https://www.xendit.co/) payment gateway integration. Provides a typed, idiomatic wrapper around Xendit's API with support for invoices, virtual accounts, e-wallets, QRIS, retail outlets, credit cards, direct debit, disbursements, and balance queries.

## Features

- **9 Payment Products** — Invoice, Virtual Account, E-Wallet, QRIS, Retail Outlet, Credit Card, Direct Debit, Disbursement, Balance
- **Type-safe** — Full TypeScript types for all request/response shapes
- **IoC Container Integration** — `xendit.manager` singleton registered via provider
- **Webhook Helpers** — Built-in webhook payload parsing with callback token verification
- **Configurable** — `node ace configure` prompts for API key and generates config
- **Error Handling** — Custom `XenditException` with structured error responses
- **Idempotency Support** — Optional idempotency keys for safe retries
- **Production Ready** — Comprehensive test suite with >80% coverage
- **Retry Logic** — Automatic retry with exponential backoff for failed requests

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Invoice](#invoice)
  - [Virtual Account](#virtual-account)
  - [E-Wallet](#e-wallet)
  - [QRIS](#qris)
  - [Retail Outlet](#retail-outlet)
  - [Credit Card](#credit-card)
  - [Direct Debit](#direct-debit)
  - [Disbursement](#disbursement)
  - [Balance](#balance)
- [Webhook Handling](#webhook-handling)
- [Error Handling](#error-handling)
- [Exported Types](#exported-types)
- [Requirements](#requirements)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Security](#security)
- [Support](#support)
- [License](#license)

## Installation

```sh
npm install @rikology/adonisjs-xendit
# or
yarn add @rikology/adonisjs-xendit
# or
pnpm add @rikology/adonisjs-xendit
```

Then configure the package:

```sh
node ace configure @rikology/adonisjs-xendit
```

The configure command will:
- Prompt for your Xendit secret key
- Generate `config/xendit.ts`
- Add `XENDIT_SECRET_KEY`, `XENDIT_ENVIRONMENT`, and `XENDIT_CALLBACK_TOKEN` to `.env`
- Register the provider in `adonisrc.ts`

## Configuration

```ts
// config/xendit.ts
import { defineConfig } from '@rikology/adonisjs-xendit'
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
import type { XenditManager } from '@rikology/adonisjs-xendit'

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

### Invoice

Create and manage invoices for one-time payments.

```ts
// Create an invoice
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Test invoice',
  invoice_duration: 86400,
  payer_email: 'customer@example.com',
  customer: {
    given_names: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    mobile_number: '+6281234567890',
  },
  items: [
    { name: 'Product A', quantity: 1, price: 50000 },
  ],
  success_redirect_url: 'https://example.com/success',
  failure_redirect_url: 'https://example.com/failure',
})

// Get invoice by ID
const invoice = await xendit.invoice().getById('inv_123')

// List invoices with filters
const invoices = await xendit.invoice().list({
  status: 'PAID',
  limit: 10,
})

// Expire an invoice
const expired = await xendit.invoice().expire('inv_123')
```

### Virtual Account

Create virtual accounts for bank transfers.

```ts
// Create a virtual account
const va = await xendit.va().create({
  external_id: 'va-123',
  bank_code: 'BCA',
  name: 'John Doe',
  is_closed: true,
  expected_amount: 100000,
  is_single_use: true,
})

// Get VA by ID
const va = await xendit.va().getById('va_123')

// Update VA
const updated = await xendit.va().update('va_123', {
  name: 'Jane Doe',
  expected_amount: 150000,
})

// Get VA payments
const payments = await xendit.va().getPayment('va_123')
```

Supported banks: `BCA`, `BNI`, `BRI`, `MANDIRI`, `PERMATA`, `CIMB`, `BSI`, and more.

### E-Wallet

Process payments through popular e-wallets.

```ts
// Create OVO payment
const charge = await xendit.ewallet().createOvo({
  reference_id: 'order-123',
  currency: 'IDR',
  amount: 50000,
  channel_code: 'ID_OVO',
  channel_properties: {
    mobile_number: '+6281234567890',
  },
})

// Create DANA payment
const charge = await xendit.ewallet().createDana({
  reference_id: 'order-124',
  currency: 'IDR',
  amount: 75000,
})

// Create LinkAja payment
const charge = await xendit.ewallet().createLinkAja({
  reference_id: 'order-125',
  currency: 'IDR',
  amount: 100000,
})

// Create ShopeePay payment
const charge = await xendit.ewallet().createShopeepay({
  reference_id: 'order-126',
  currency: 'IDR',
  amount: 25000,
})

// Check payment status
const status = await xendit.ewallet().getStatus('ewc_123')
```

### QRIS

Generate QR codes for QRIS payments.

```ts
// Create dynamic QR code
const qr = await xendit.qris().create({
  external_id: 'order-123',
  type: 'DYNAMIC',
  amount: 50000,
  currency: 'IDR',
})

// Create static QR code
const qr = await xendit.qris().create({
  external_id: 'store-123',
  type: 'STATIC',
  currency: 'IDR',
})

// Get QR code by ID
const qr = await xendit.qris().getById('qr_123')

// Simulate payment (sandbox only)
const payment = await xendit.qris().simulate('qr_123', { amount: 50000 })
```

### Retail Outlet

Create payments through retail outlets like Alfamart and Indomaret.

```ts
// Create retail outlet payment
const payment = await xendit.retailOutlet().create({
  external_id: 'order-123',
  retail_outlet_name: 'ALFAMART',
  name: 'John Doe',
  expected_amount: 50000,
  is_single_use: true,
})

// Get payment by ID
const payment = await xendit.retailOutlet().getById('ro_123')

// Update payment
const updated = await xendit.retailOutlet().update('ro_123', {
  name: 'Jane Doe',
  expected_amount: 75000,
})
```

Supported outlets: `ALFAMART`, `ALFAMIDI`, `INDOMARET`, and more.

### Credit Card

Process credit card payments.

```ts
// Create authorization
const auth = await xendit.creditCard().createAuthorization({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
})

// Create charge
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
  capture: true,
})

// Create refund
const refund = await xendit.creditCard().createRefund('charge_123', {
  external_id: 'refund-123',
  amount: 50000,
})

// Get charge details
const charge = await xendit.creditCard().getCharge('charge_123')
```

### Direct Debit

Process direct debit payments.

```ts
// Create payment method
const method = await xendit.directDebit().createPaymentMethod({
  customer_id: 'cust_123',
  channel_code: 'BRI',
  properties: {
    account_number: '1234567890',
  },
})

// Validate OTP
const validated = await xendit.directDebit().validateOTP('pm_123', {
  otp_code: '123456',
})

// Create payment
const payment = await xendit.directDebit().createPayment({
  reference_id: 'order-123',
  payment_method_id: 'pm_123',
  currency: 'IDR',
  amount: 100000,
})

// Get payment details
const payment = await xendit.directDebit().getPayment('pay_123')
```

### Disbursement

Send money to bank accounts and e-wallets.

```ts
// Create disbursement
const disbursement = await xendit.disbursement().create({
  external_id: 'disb-123',
  amount: 100000,
  bank_code: 'BCA',
  account_holder_name: 'John Doe',
  account_number: '1234567890',
  description: 'Payout for order #123',
})

// Get disbursement by ID
const disbursement = await xendit.disbursement().getById('disb_123')

// Create batch disbursement
const batch = await xendit.disbursement().createBatch({
  reference: 'batch-123',
  disbursements: [
    {
      external_id: 'disb-1',
      amount: 50000,
      bank_code: 'BCA',
      account_holder_name: 'Alice',
      account_number: '1111111111',
    },
    {
      external_id: 'disb-2',
      amount: 50000,
      bank_code: 'BNI',
      account_holder_name: 'Bob',
      account_number: '2222222222',
    },
  ],
})

// Get available banks
const banks = await xendit.disbursement().getAvailableBanks()
```

### Balance

Check your Xendit account balance.

```ts
// Get total balance
const balance = await xendit.balance().get()

// Get balance by account type
const cashBalance = await xendit.balance().getByAccountType('CASH')
const holdingBalance = await xendit.balance().getByAccountType('HOLDING')
const taxBalance = await xendit.balance().getByAccountType('TAX')
```

## Webhook Handling

```ts
import { XenditWebhook } from '@rikology/adonisjs-xendit'

export default class WebhooksController {
  async handle(req: HttpContext) {
    const callbackToken = process.env.XENDIT_CALLBACK_TOKEN!
    const signature = req.request.header('x-callback-token')!
    const payload = JSON.stringify(req.request.all())

    // Verify callback token
    if (!XenditWebhook.verify(payload, callbackToken, signature)) {
      return req.response.forbidden('Invalid callback token')
    }

    // Parse and validate payload
    const event = XenditWebhook.parseEvent(payload)

    // Process based on event type
    switch (event.event) {
      case 'invoice.paid':
        // Handle paid invoice
        console.log('Invoice paid:', event.data)
        break
      case 'invoice.expired':
        // Handle expired invoice
        console.log('Invoice expired:', event.data)
        break
      case 'va.paid':
        // Handle VA payment
        console.log('VA paid:', event.data)
        break
      case 'disbursement.completed':
        // Handle completed disbursement
        console.log('Disbursement completed:', event.data)
        break
      default:
        console.log('Unhandled event:', event.event)
    }
  }
}
```

## Error Handling

```ts
import { XenditException } from '@rikology/adonisjs-xendit'

try {
  await xendit.invoice().create({ ... })
} catch (error) {
  if (error instanceof XenditException) {
    console.log(error.code)      // XENDIT_API_ERROR
    console.log(error.status)    // HTTP status code
    console.log(error.message)   // Error message
    console.log(error.rawResponse)  // Full error response body
  }
}
```

### Error Types

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `XenditValidationError` | 400 | Invalid request parameters |
| `XenditAuthenticationError` | 401 | Invalid API key |
| `XenditNotFoundError` | 404 | Resource not found |
| `XenditConflictError` | 409 | Duplicate external ID |
| `XenditRateLimitError` | 429 | Rate limit exceeded |
| `XenditServerError` | 500 | Xendit server error |
| `XenditNetworkError` | 0 | Network/timeout error |

## Exported Types

```ts
import type {
  XenditConfig,
  CreateInvoiceRequest,
  Invoice,
  CreateVirtualAccountRequest,
  VirtualAccount,
  CreateEWalletChargeRequest,
  EWalletCharge,
  CreateQRCodeRequest,
  QRCode,
  CreateRetailOutletRequest,
  RetailOutlet,
  CreateCreditCardChargeRequest,
  CreditCardCharge,
  CreateDirectDebitPaymentRequest,
  DirectDebitPayment,
  CreateDisbursementRequest,
  Disbursement,
  Balance,
  // ... and more
} from '@rikology/adonisjs-xendit'
```

See `src/types.ts` for the complete type definitions.

## Requirements

- Node.js >= 20.0.0
- AdonisJS v7

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Security

If you discover any security-related issues, please email [rikoriswandha@gmail.com](mailto:rikoriswandha@gmail.com) instead of using the issue tracker. See our [Security Policy](SECURITY.md) for more details.

## Support

- 📖 [Documentation](https://github.com/rikoriswandha/adonisjs-xendit#readme)
- 🐛 [Issue Tracker](https://github.com/rikoriswandha/adonisjs-xendit/issues)
- 📧 [Email](mailto:rikoriswandha@gmail.com)

## License

MIT
