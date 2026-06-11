# E-Wallet

Process payments through popular e-wallet applications in Indonesia and Southeast Asia.

## Overview

E-Wallet payments provide a seamless checkout experience where customers authorize payments through their preferred e-wallet app.

## Supported E-Wallets

### Indonesia

| Channel Code | E-Wallet |
|--------------|----------|
| `ID_OVO` | OVO |
| `ID_DANA` | DANA |
| `ID_LINKAJA` | LinkAja |
| `ID_SHOPEEPAY` | ShopeePay |
| `ID_GO_PAY` | GoPay |
| `ID_ASTRAPAY` | AstraPay |
| `ID_JENIUS` | Jenius |
| `ID_SAKUKU` | Sakuku |

### Philippines

| Channel Code | E-Wallet |
|--------------|----------|
| `PH_GCASH` | GCash |
| `PH_PAYMAYA` | PayMaya |
| `PH_GRABPAY` | GrabPay |

### Vietnam

| Channel Code | E-Wallet |
|--------------|----------|
| `VN_MOMO` | MoMo |
| `VN_ZALOPAY` | ZaloPay |

### Thailand

| Channel Code | E-Wallet |
|--------------|----------|
| `TH_TRUEMONEY` | TrueMoney |

### Malaysia

| Channel Code | E-Wallet |
|--------------|----------|
| `MY_TOUCHNGO` | Touch 'n Go |
| `MY_GRABPAY` | GrabPay |

## Creating E-Wallet Charges

### OVO Payment

```typescript
const charge = await xendit.ewallet().createOvo({
  reference_id: 'order-123',
  currency: 'IDR',
  amount: 50000,
  channel_code: 'ID_OVO',
  channel_properties: {
    mobile_number: '+6281234567890',
  },
  metadata: {
    order_id: 'order-123',
    customer_id: 'cust-456',
  },
})
```

### DANA Payment

```typescript
const charge = await xendit.ewallet().createDana({
  reference_id: 'order-124',
  currency: 'IDR',
  amount: 75000,
  channel_code: 'ID_DANA',
  channel_properties: {
    success_redirect_url: 'https://example.com/success',
    failure_redirect_url: 'https://example.com/failure',
  },
})
```

### LinkAja Payment

```typescript
const charge = await xendit.ewallet().createLinkAja({
  reference_id: 'order-125',
  currency: 'IDR',
  amount: 100000,
  channel_code: 'ID_LINKAJA',
  channel_properties: {
    success_redirect_url: 'https://example.com/success',
    failure_redirect_url: 'https://example.com/failure',
  },
})
```

### ShopeePay Payment

```typescript
const charge = await xendit.ewallet().createShopeepay({
  reference_id: 'order-126',
  currency: 'IDR',
  amount: 25000,
  channel_code: 'ID_SHOPEEPAY',
  channel_properties: {
    success_redirect_url: 'https://example.com/success',
  },
})
```

## Checking Payment Status

```typescript
const charge = await xendit.ewallet().getStatus('ewc_123')

console.log(charge.status) // 'PENDING', 'SUCCEEDED', 'FAILED', or 'EXPIRED'
console.log(charge.charge_amount)
console.log(charge.refunded_amount)
```

## Handling Payment Actions

Some e-wallets return actions that require customer interaction:

```typescript
const charge = await xendit.ewallet().createOvo({
  reference_id: 'order-123',
  currency: 'IDR',
  amount: 50000,
  channel_code: 'ID_OVO',
})

if (charge.actions) {
  for (const action of charge.actions) {
    if (action.name === 'CHECKOUT_URL') {
      // Redirect customer to this URL
      return response.redirect(action.url)
    }
  }
}
```

## Complete Payment Flow

### 1. Create Charge

```typescript
const charge = await xendit.ewallet().createDana({
  reference_id: `order-${orderId}`,
  currency: 'IDR',
  amount: orderTotal,
  channel_code: 'ID_DANA',
  channel_properties: {
    success_redirect_url: `${baseUrl}/payment/success`,
    failure_redirect_url: `${baseUrl}/payment/failure`,
  },
})

// Store charge ID for later reference
await saveChargeId(orderId, charge.id)

// If there's a checkout URL, redirect the customer
if (charge.actions?.[0]?.url) {
  return response.redirect(charge.actions[0].url)
}
```

### 2. Handle Webhook

```typescript
switch (event.event) {
  case 'ewallet.payment':
    const { reference_id, status, charge_amount } = event.data
    
    if (status === 'SUCCEEDED') {
      await markOrderAsPaid(reference_id, charge_amount)
    } else if (status === 'FAILED') {
      await markOrderAsFailed(reference_id)
    }
    break
}
```

### 3. Verify Status (Optional)

```typescript
// Poll for status if needed
const charge = await xendit.ewallet().getStatus(chargeId)

if (charge.status === 'SUCCEEDED') {
  await fulfillOrder(orderId)
}
```

## E-Wallet Specific Behaviors

### OVO

- Requires customer's registered mobile number
- Customer receives push notification to approve payment
- No redirect URL needed

```typescript
const charge = await xendit.ewallet().createOvo({
  reference_id: 'order-123',
  currency: 'IDR',
  amount: 50000,
  channel_code: 'ID_OVO',
  channel_properties: {
    mobile_number: '+6281234567890',
  },
})
```

### DANA / LinkAja / ShopeePay

- Returns a checkout URL
- Customer must scan QR or open the app
- Requires redirect URLs

```typescript
const charge = await xendit.ewallet().createDana({
  reference_id: 'order-123',
  currency: 'IDR',
  amount: 50000,
  channel_code: 'ID_DANA',
  channel_properties: {
    success_redirect_url: 'https://example.com/success',
    failure_redirect_url: 'https://example.com/failure',
    cancel_redirect_url: 'https://example.com/cancel',
  },
})
```

## Error Handling

```typescript
import { XenditValidationError } from '@rikology/adonisjs-xendit'

try {
  const charge = await xendit.ewallet().createOvo({
    reference_id: 'order-123',
    currency: 'IDR',
    amount: 50000,
    channel_code: 'ID_OVO',
    channel_properties: {
      mobile_number: '081234567890', // Invalid: missing country code
    },
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Invalid mobile number format:', error.message)
  }
}
```
