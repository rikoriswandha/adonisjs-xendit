# Invoice

The Invoice API allows you to create and manage payment requests that support multiple payment methods.

## Overview

Invoices are the most flexible payment method in Xendit. When you create an invoice, Xendit generates a unique payment URL that supports:

- Virtual Accounts (BCA, BNI, BRI, Mandiri, etc.)
- E-Wallets (OVO, DANA, LinkAja, ShopeePay)
- QRIS
- Retail Outlets (Alfamart, Indomaret)
- Credit Cards

## Creating an Invoice

### Basic Invoice

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Payment for Order #123',
})
```

### Invoice with Customer Details

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 100000,
  description: 'Premium Plan Subscription',
  payer_email: 'customer@example.com',
  customer: {
    given_names: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    mobile_number: '+6281234567890',
    address: {
      country: 'ID',
      street_line_1: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postal_code: '12190',
    },
  },
})
```

### Invoice with Items

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 250000,
  description: 'Multiple items purchase',
  items: [
    {
      name: 'T-Shirt',
      quantity: 2,
      price: 100000,
      category: 'Apparel',
      url: 'https://example.com/products/t-shirt',
    },
    {
      name: 'Shipping',
      quantity: 1,
      price: 50000,
      category: 'Service',
    },
  ],
})
```

### Invoice with Redirect URLs

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Test invoice',
  success_redirect_url: 'https://example.com/payment/success',
  failure_redirect_url: 'https://example.com/payment/failure',
})
```

### Invoice with Expiration

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Test invoice',
  invoice_duration: 3600, // 1 hour in seconds
})
```

### Invoice with Fixed VA

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Test invoice',
  fixed_va: true, // Customer will see the same VA number for future invoices
})
```

### Invoice with Email Notifications

```typescript
const invoice = await xendit.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Test invoice',
  should_send_email: true,
  customer_notification_preference: {
    invoice_created: ['EMAIL', 'SMS'],
    invoice_reminder: ['EMAIL'],
    invoice_paid: ['EMAIL', 'WA'],
  },
})
```

### Invoice with Idempotency Key

Use idempotency keys to prevent duplicate charges:

```typescript
const invoice = await xendit.invoice().create(
  {
    external_id: 'order-123',
    amount: 50000,
    description: 'Test invoice',
  },
  {
    idempotencyKey: 'unique-key-123',
  }
)
```

## Retrieving Invoices

### Get by ID

```typescript
const invoice = await xendit.invoice().getById('inv_123')
console.log(invoice.status) // 'PENDING', 'PAID', 'SETTLED', or 'EXPIRED'
```

### List Invoices

```typescript
// List all invoices
const invoices = await xendit.invoice().list()

// List with filters
const paidInvoices = await xendit.invoice().list({
  status: 'PAID',
  limit: 10,
})

// List by date range
const recentInvoices = await xendit.invoice().list({
  created_after: '2024-01-01T00:00:00.000Z',
  created_before: '2024-01-31T23:59:59.999Z',
})
```

## Managing Invoices

### Expire an Invoice

```typescript
const expiredInvoice = await xendit.invoice().expire('inv_123')
```

## Invoice Response

The invoice response contains comprehensive information:

```typescript
interface Invoice {
  id: string
  external_id: string
  user_id: string
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED'
  merchant_name: string
  merchant_profile_picture_url: string
  amount: number
  payer_email?: string
  description?: string
  invoice_url: string // Payment URL to share with customer
  expiry_date: string
  available_banks: Bank[] // List of available virtual accounts
  available_retail_outlets: RetailOutletInfo[]
  available_ewallets: EwalletInfo[]
  available_qr_codes: QrCodeInfo[]
  available_direct_debits: DirectDebitInfo[]
  should_send_email: boolean
  created: string
  updated: string
  currency: XenditCurrency
  items?: InvoiceItem[]
  customer?: CustomerObject
  paid_at?: string
  paid_amount?: number
  payment_method?: string
  payment_channel?: string
}
```

## Best Practices

### Unique External IDs

Always use unique `external_id` values. Duplicate IDs will result in a `409 Conflict` error:

```typescript
// Good: Unique ID with timestamp
const externalId = `order-${userId}-${Date.now()}`

// Bad: Static ID that may conflict
const externalId = 'order-123'
```

### Handling Invoice Status

```typescript
const invoice = await xendit.invoice().getById('inv_123')

switch (invoice.status) {
  case 'PENDING':
    // Invoice is awaiting payment
    console.log(`Payment URL: ${invoice.invoice_url}`)
    break
  case 'PAID':
    // Payment received, awaiting settlement
    console.log(`Paid at: ${invoice.paid_at}`)
    break
  case 'SETTLED':
    // Funds have been settled to your account
    console.log(`Settled amount: ${invoice.paid_amount}`)
    break
  case 'EXPIRED':
    // Invoice has expired
    console.log('Invoice expired, create a new one')
    break
}
```

### Webhook Integration

Set up webhooks to receive real-time payment notifications:

```typescript
// In your webhook controller
switch (event.event) {
  case 'invoice.paid':
    await processPaidInvoice(event.data)
    break
  case 'invoice.expired':
    await processExpiredInvoice(event.data)
    break
}
```

## Error Handling

```typescript
import { XenditValidationError, XenditConflictError } from '@rikology/adonisjs-xendit'

try {
  const invoice = await xendit.invoice().create({
    external_id: 'order-123',
    amount: -100, // Invalid: negative amount
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Validation failed:', error.message)
    // Handle validation error
  } else if (error instanceof XenditConflictError) {
    console.log('Duplicate external ID:', error.message)
    // Handle duplicate ID
  }
}
```
