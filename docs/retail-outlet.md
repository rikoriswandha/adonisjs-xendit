# Retail Outlet

Create payments through retail outlets like Alfamart and Indomaret.

## Overview

Retail outlet payments allow customers to pay in cash at physical stores. This is ideal for:

- Customers without bank accounts
- Cash-preferred transactions
- Unbanked populations
- Physical retail presence

## Supported Retail Outlets

| Outlet Code | Name |
|-------------|------|
| `ALFAMART` | Alfamart |
| `ALFAMIDI` | Alfamidi |
| `INDOMARET` | Indomaret |
| `CEBUANA` | Cebuana Lhuillier |
| `ECPAY` | EC Pay |
| `PALAWAN` | Palawan Pawnshop |
| `MLHUILLIER` | M Lhuillier |
| `LBC` | LBC Express |

## Creating Retail Outlet Payments

### Basic Payment

```typescript
const payment = await xendit.retailOutlet().create({
  external_id: 'order-123',
  retail_outlet_name: 'ALFAMART',
  name: 'John Doe',
  expected_amount: 50000,
})
```

### Payment with Custom Code

```typescript
const payment = await xendit.retailOutlet().create({
  external_id: 'order-123',
  retail_outlet_name: 'ALFAMART',
  name: 'John Doe',
  expected_amount: 100000,
  payment_code: 'CUSTOM123', // Optional custom payment code
})
```

### Single-Use Payment

```typescript
const payment = await xendit.retailOutlet().create({
  external_id: 'order-123',
  retail_outlet_name: 'INDOMARET',
  name: 'John Doe',
  expected_amount: 75000,
  is_single_use: true, // Expires after payment
})
```

### Payment with Expiration

```typescript
const payment = await xendit.retailOutlet().create({
  external_id: 'order-123',
  retail_outlet_name: 'ALFAMART',
  name: 'John Doe',
  expected_amount: 50000,
  expiration_date: '2024-12-31T23:59:59.000Z',
})
```

## Retrieving Payments

### Get by ID

```typescript
const payment = await xendit.retailOutlet().getById('ro_123')
console.log(payment.payment_code) // Code for customer to use at store
console.log(payment.status) // 'ACTIVE', 'INACTIVE', or 'EXPIRED'
```

## Updating Payments

```typescript
// Update amount
const updated = await xendit.retailOutlet().update('ro_123', {
  expected_amount: 100000,
})

// Update name
const updated = await xendit.retailOutlet().update('ro_123', {
  name: 'Jane Doe',
})

// Deactivate
const updated = await xendit.retailOutlet().update('ro_123', {
  status: 'INACTIVE',
})
```

## Payment Instructions for Customers

### Alfamart/Alfamidi

1. Go to nearest Alfamart/Alfamidi store
2. Tell cashier you want to make a payment
3. Provide the payment code: `ALFA123456`
4. Pay the exact amount in cash
5. Keep the receipt

### Indomaret

1. Go to nearest Indomaret store
2. Tell cashier you want to make a payment
3. Provide the payment code: `INDO123456`
4. Pay the exact amount in cash
5. Keep the receipt

## Use Cases

### E-Commerce Cash Payment

```typescript
// Create retail outlet payment option
const payment = await xendit.retailOutlet().create({
  external_id: `order-${orderId}`,
  retail_outlet_name: 'ALFAMART',
  name: customerName,
  expected_amount: orderTotal,
  is_single_use: true,
})

// Display to customer
return response.json({
  outlet: 'Alfamart',
  paymentCode: payment.payment_code,
  amount: payment.expected_amount,
  expirationDate: payment.expiration_date,
  instructions: [
    'Go to nearest Alfamart store',
    'Tell cashier you want to make payment',
    `Provide code: ${payment.payment_code}`,
    `Pay exact amount: Rp ${payment.expected_amount?.toLocaleString()}`,
  ],
})
```

### Multiple Outlet Options

```typescript
// Offer multiple outlet options
const outlets = ['ALFAMART', 'INDOMARET']
const payments = await Promise.all(
  outlets.map(outlet =>
    xendit.retailOutlet().create({
      external_id: `order-${orderId}-${outlet}`,
      retail_outlet_name: outlet,
      name: customerName,
      expected_amount: orderTotal,
      is_single_use: true,
    })
  )
)

// Return options to customer
return response.json({
  options: payments.map(p => ({
    outlet: p.retail_outlet_name,
    paymentCode: p.payment_code,
    amount: p.expected_amount,
  })),
})
```

## Webhook Events

Listen for retail outlet payment events:

```typescript
switch (event.event) {
  case 'retail_outlet.payment':
    const { external_id, amount, status } = event.data
    
    if (status === 'COMPLETED') {
      await processPayment(external_id, amount)
    }
    break
}
```

## Error Handling

```typescript
import { XenditValidationError } from '@rikology/adonisjs-xendit'

try {
  const payment = await xendit.retailOutlet().create({
    external_id: 'order-123',
    retail_outlet_name: 'INVALID_OUTLET',
    name: 'John Doe',
    expected_amount: 50000,
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Invalid outlet:', error.message)
  }
}
```
