# Virtual Account

Virtual Accounts (VA) allow customers to pay via bank transfer using a unique account number.

## Overview

Virtual accounts are ideal for:

- Bank transfer payments
- Recurring billing with fixed VA numbers
- Single-use or multi-use payments
- Open or closed amount payments

## Supported Banks

| Bank Code | Bank Name |
|-----------|-----------|
| `BCA` | Bank Central Asia |
| `BNI` | Bank Negara Indonesia |
| `BRI` | Bank Rakyat Indonesia |
| `MANDIRI` | Bank Mandiri |
| `PERMATA` | Bank Permata |
| `CIMB` | CIMB Niaga |
| `BSI` | Bank Syariah Indonesia |
| `BANK_JAGO` | Bank Jago |
| `BANK_NEO` | Bank Neo Commerce |
| And more... |

## Creating a Virtual Account

### Open VA (Any Amount)

```typescript
const va = await xendit.va().create({
  external_id: 'va-123',
  bank_code: 'BCA',
  name: 'John Doe',
})
```

### Closed VA (Fixed Amount)

```typescript
const va = await xendit.va().create({
  external_id: 'va-123',
  bank_code: 'BCA',
  name: 'John Doe',
  is_closed: true,
  expected_amount: 100000,
})
```

### Single-Use VA

```typescript
const va = await xendit.va().create({
  external_id: 'va-123',
  bank_code: 'BCA',
  name: 'John Doe',
  is_single_use: true,
  expected_amount: 50000,
})
```

### VA with Expiration

```typescript
const va = await xendit.va().create({
  external_id: 'va-123',
  bank_code: 'BCA',
  name: 'John Doe',
  is_single_use: true,
  expected_amount: 100000,
  expiration_date: '2024-12-31T23:59:59.000Z',
})
```

### VA with Suggested Amount

```typescript
const va = await xendit.va().create({
  external_id: 'va-123',
  bank_code: 'BCA',
  name: 'John Doe',
  suggested_amount: 50000, // Customer can pay any amount, but 50k is suggested
})
```

## Retrieving VA Information

### Get by ID

```typescript
const va = await xendit.va().getById('va_123')
console.log(va.account_number) // The VA number to share with customer
console.log(va.status) // 'ACTIVE', 'INACTIVE', or 'EXPIRED'
```

### Get Payments

```typescript
const payments = await xendit.va().getPayment('va_123')
console.log(payments.status) // 'PENDING' or 'SETTLED'
console.log(payments.paid_amount)
console.log(payments.paid_at)
```

## Updating a Virtual Account

```typescript
// Update name and amount
const updated = await xendit.va().update('va_123', {
  name: 'Jane Doe',
  expected_amount: 150000,
})

// Deactivate VA
const deactivated = await xendit.va().update('va_123', {
  status: 'INACTIVE',
})

// Extend expiration
const extended = await xendit.va().update('va_123', {
  expiration_date: '2025-01-31T23:59:59.000Z',
})
```

## VA Types Explained

### Open vs Closed

**Open VA:**
- Customer can pay any amount
- No `expected_amount` required
- Good for donations or top-ups

**Closed VA:**
- Customer must pay exact amount
- Requires `expected_amount`
- Good for fixed-price products

### Single-Use vs Multi-Use

**Single-Use:**
- VA expires after first payment
- Automatically set to `INACTIVE` after payment
- Good for one-time purchases

**Multi-Use:**
- VA remains active after payment
- Can receive multiple payments
- Good for recurring billing

## Use Cases

### E-Commerce Checkout

```typescript
// Create a single-use closed VA for checkout
const va = await xendit.va().create({
  external_id: `checkout-${orderId}`,
  bank_code: 'BCA',
  name: customerName,
  is_closed: true,
  expected_amount: orderTotal,
  is_single_use: true,
})

// Display to customer
return {
  bank: 'BCA',
  accountNumber: va.account_number,
  accountName: va.name,
  amount: va.expected_amount,
  expirationDate: va.expiration_date,
}
```

### Recurring Billing with Fixed VA

```typescript
// Create a multi-use VA for subscription
const va = await xendit.va().create({
  external_id: `sub-${userId}`,
  bank_code: 'BNI',
  name: customerName,
  is_closed: true,
  expected_amount: subscriptionAmount,
  is_single_use: false, // Multi-use
})

// Store va.account_number for future billing cycles
await saveCustomerVA(userId, va.account_number)
```

### Top-Up System

```typescript
// Create an open VA for wallet top-up
const va = await xendit.va().create({
  external_id: `topup-${userId}`,
  bank_code: 'BRI',
  name: customerName,
  is_closed: false, // Open amount
  is_single_use: true,
})

// Customer can top up any amount
return {
  bank: 'BRI',
  accountNumber: va.account_number,
  accountName: va.name,
}
```

## Webhook Events

Listen for VA payment events:

```typescript
switch (event.event) {
  case 'va.paid':
    const { id, payment_id, amount, paid_at } = event.data
    await processVAPayment(id, payment_id, amount, paid_at)
    break
}
```

## Error Handling

```typescript
import { XenditValidationError, XenditNotFoundError } from '@rikology/adonisjs-xendit'

try {
  const va = await xendit.va().create({
    external_id: 'va-123',
    bank_code: 'INVALID_BANK', // Invalid bank code
    name: 'John Doe',
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Invalid bank code:', error.message)
  }
}
```
