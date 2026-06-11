# Direct Debit

Process direct debit payments from bank accounts.

## Overview

Direct Debit allows you to charge customers' bank accounts directly after they authorize the payment method.

## Supported Banks

| Channel Code | Bank |
|--------------|------|
| `BCA_ONEKLIK` | BCA OneKlik |
| `BCA_KLIKPAY` | BCA KlikPay |
| `BRI` | BRI |
| `MANDIRI` | Mandiri |
| `MANDIRI_SNAP` | Mandiri SNAP |
| `BNI` | BNI |
| `PERMATA` | Permata |
| `BJB` | BJB |
| `BSI` | BSI |
| `BTN` | BTN |

## Payment Flow

1. **Create Payment Method** — Customer links their bank account
2. **Validate OTP** — Customer confirms with OTP
3. **Create Payment** — Charge the linked account

## Creating Payment Methods

### Basic Payment Method

```typescript
const method = await xendit.directDebit().createPaymentMethod({
  customer_id: 'cust_123',
  channel_code: 'BRI',
  properties: {
    account_number: '1234567890',
  },
})

console.log(method.status) // 'PENDING' — requires OTP validation
```

### Payment Method with Metadata

```typescript
const method = await xendit.directDebit().createPaymentMethod({
  customer_id: 'cust_123',
  channel_code: 'BRI',
  properties: {
    account_number: '1234567890',
  },
  metadata: {
    user_id: 'user-123',
    subscription_id: 'sub-456',
  },
})
```

## Validating OTP

After creating a payment method, validate with OTP:

```typescript
const validated = await xendit.directDebit().validateOTP('pm_123', {
  otp_code: '123456',
})

console.log(validated.status) // 'ACTIVE' — ready for payments
```

## Creating Payments

### Basic Payment

```typescript
const payment = await xendit.directDebit().createPayment({
  reference_id: 'order-123',
  payment_method_id: 'pm_123',
  currency: 'IDR',
  amount: 100000,
})
```

### Payment with Device Info

```typescript
const payment = await xendit.directDebit().createPayment({
  reference_id: 'order-123',
  payment_method_id: 'pm_123',
  currency: 'IDR',
  amount: 100000,
  device: {
    id: 'device-123',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
  },
})
```

### Payment with Callback URL

```typescript
const payment = await xendit.directDebit().createPayment({
  reference_id: 'order-123',
  payment_method_id: 'pm_123',
  currency: 'IDR',
  amount: 100000,
  callback_url: 'https://example.com/webhooks/direct-debit',
})
```

## Retrieving Payments

```typescript
const payment = await xendit.directDebit().getPayment('pay_123')
console.log(payment.status) // 'PENDING', 'SUCCEEDED', or 'FAILED'
```

## Complete Payment Flow

### 1. Link Bank Account

```typescript
// Customer initiates bank linking
const method = await xendit.directDebit().createPaymentMethod({
  customer_id: customerId,
  channel_code: 'BRI',
  properties: {
    account_number: accountNumber,
  },
})

// Store payment method ID
await savePaymentMethod(customerId, method.id)

// Prompt customer for OTP
return response.json({
  paymentMethodId: method.id,
  status: method.status,
  message: 'Enter OTP sent to your phone',
})
```

### 2. Validate OTP

```typescript
// Customer submits OTP
const { paymentMethodId, otpCode } = request.only(['paymentMethodId', 'otpCode'])

const validated = await xendit.directDebit().validateOTP(paymentMethodId, {
  otp_code: otpCode,
})

if (validated.status === 'ACTIVE') {
  await markPaymentMethodAsActive(paymentMethodId)
  return response.json({ status: 'success' })
}
```

### 3. Create Payment

```typescript
// Charge the linked account
const payment = await xendit.directDebit().createPayment({
  reference_id: `order-${orderId}`,
  payment_method_id: paymentMethodId,
  currency: 'IDR',
  amount: orderTotal,
})

if (payment.status === 'SUCCEEDED') {
  await fulfillOrder(orderId)
}
```

### 4. Handle Webhook

```typescript
switch (event.event) {
  case 'direct_debit.payment':
    const { reference_id, status, amount } = event.data
    
    if (status === 'SUCCEEDED') {
      await processPayment(reference_id, amount)
    }
    break
}
```

## Recurring Payments

For subscriptions, store the payment method and reuse:

```typescript
// Store payment method during setup
const method = await xendit.directDebit().createPaymentMethod({
  customer_id: customerId,
  channel_code: 'BRI',
  properties: { account_number: accountNumber },
})

const validated = await xendit.directDebit().validateOTP(method.id, {
  otp_code: otpCode,
})

// Store for future use
await saveRecurringPaymentMethod(customerId, validated.id)

// Later, charge for subscription
const payment = await xendit.directDebit().createPayment({
  reference_id: `subscription-${subscriptionId}-${Date.now()}`,
  payment_method_id: validated.id,
  currency: 'IDR',
  amount: subscriptionAmount,
})
```

## Error Handling

```typescript
import { XenditValidationError } from '@rikology/adonisjs-xendit'

try {
  const payment = await xendit.directDebit().createPayment({
    reference_id: 'order-123',
    payment_method_id: 'pm_123',
    currency: 'IDR',
    amount: 100000,
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Payment failed:', error.message)
  }
}
```
