# Credit Card

Process credit and debit card payments securely.

## Overview

The Credit Card API allows you to:

- Create charges (capture funds)
- Create authorizations (hold funds)
- Refund charges
- Retrieve charge details

## Creating Charges

### Basic Charge

```typescript
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
  capture: true, // Capture immediately
})
```

### Charge with 3DS

```typescript
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
  authentication_id: 'auth_123', // 3DS authentication ID
  capture: true,
})
```

### Charge without Capture (Authorization)

```typescript
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
  capture: false, // Authorize only, capture later
})
```

### Charge with Billing Details

```typescript
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
  capture: true,
  billing_details: {
    given_names: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    phone: '+6281234567890',
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

### Charge with Installments

```typescript
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 1200000,
  capture: true,
  installment: {
    count: 6,
    interval: 'MONTH',
  },
})
```

## Creating Authorizations

Authorizations hold funds without capturing them:

```typescript
const auth = await xendit.creditCard().createAuthorization({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
})

// Later, capture the authorization
const charge = await xendit.creditCard().createCharge({
  token_id: 'token_123',
  external_id: 'order-123',
  amount: 100000,
  authentication_id: auth.id,
  capture: true,
})
```

## Refunding Charges

### Full Refund

```typescript
const refund = await xendit.creditCard().createRefund('charge_123', {
  external_id: 'refund-123',
  amount: 100000,
})
```

### Partial Refund

```typescript
const refund = await xendit.creditCard().createRefund('charge_123', {
  external_id: 'refund-123',
  amount: 50000, // Partial amount
})
```

## Retrieving Charges

```typescript
const charge = await xendit.creditCard().getCharge('charge_123')
console.log(charge.status) // 'PENDING', 'SUCCEEDED', 'FAILED', etc.
console.log(charge.card_brand) // 'VISA', 'MASTERCARD', etc.
console.log(charge.masked_card_number) // '411111******1111'
```

## Charge Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Charge is being processed |
| `SUCCEEDED` | Charge completed successfully |
| `FAILED` | Charge failed |
| `REVERSED` | Charge was reversed |
| `REFUNDED` | Charge was fully refunded |
| `VOIDED` | Authorization was voided |
| `AUTHORIZED` | Funds are held (authorization only) |

## Complete Payment Flow

### 1. Create Token (Frontend)

Use Xendit.js to tokenize the card:

```javascript
// Frontend JavaScript
Xendit.setPublishableKey('your_publishable_key')

Xendit.card.createToken({
  amount: 100000,
  card_number: '4111111111111111',
  card_exp_month: '12',
  card_exp_year: '2025',
  card_cvn: '123',
}, (err, token) => {
  if (err) {
    console.error('Tokenization failed:', err)
    return
  }
  
  // Send token to backend
  fetch('/api/charge', {
    method: 'POST',
    body: JSON.stringify({ token_id: token.id }),
  })
})
```

### 2. Create Charge (Backend)

```typescript
// Backend controller
export default class PaymentsController {
  async charge({ request, response }: HttpContext) {
    const { token_id } = request.only(['token_id'])
    
    const charge = await this.xendit.creditCard().createCharge({
      token_id,
      external_id: `order-${Date.now()}`,
      amount: 100000,
      capture: true,
    })
    
    return response.json(charge)
  }
}
```

### 3. Handle Webhook

```typescript
switch (event.event) {
  case 'card_charge.succeeded':
    await processSuccessfulCharge(event.data)
    break
  case 'card_charge.failed':
    await processFailedCharge(event.data)
    break
}
```

## Error Handling

```typescript
import { XenditValidationError } from '@rikology/adonisjs-xendit'

try {
  const charge = await xendit.creditCard().createCharge({
    token_id: 'invalid_token',
    external_id: 'order-123',
    amount: 100000,
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Invalid token:', error.message)
  }
}
```
