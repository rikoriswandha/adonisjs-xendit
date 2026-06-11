# QRIS

Generate QR codes for QRIS (Quick Response Code Indonesian Standard) payments.

## Overview

QRIS is Indonesia's standardized QR code payment system that works across multiple e-wallet and banking apps.

## QR Code Types

### Dynamic QR
- Contains specific payment amount
- Generated per transaction
- Customer scans and pays exact amount

### Static QR
- No fixed amount
- Can be reused
- Customer enters amount when scanning

## Creating QR Codes

### Dynamic QR Code

```typescript
const qr = await xendit.qris().create({
  external_id: 'order-123',
  type: 'DYNAMIC',
  amount: 50000,
  currency: 'IDR',
  callback_url: 'https://example.com/webhooks/qris',
})

// Display QR string to customer
console.log(qr.qr_string) // QR code content to generate image
```

### Static QR Code

```typescript
const qr = await xendit.qris().create({
  external_id: 'store-123',
  type: 'STATIC',
  currency: 'IDR',
  callback_url: 'https://example.com/webhooks/qris',
})

// Save for reuse
await saveStoreQR(storeId, qr.qr_string)
```

### QR Code with Metadata

```typescript
const qr = await xendit.qris().create({
  external_id: 'order-123',
  type: 'DYNAMIC',
  amount: 100000,
  currency: 'IDR',
  callback_url: 'https://example.com/webhooks/qris',
  metadata: {
    order_id: 'order-123',
    customer_id: 'cust-456',
    store_id: 'store-789',
  },
})
```

## Retrieving QR Codes

### Get by ID

```typescript
const qr = await xendit.qris().getById('qr_123')
console.log(qr.status) // 'ACTIVE' or 'INACTIVE'
console.log(qr.qr_string)
```

## Simulating Payments (Sandbox)

In sandbox environment, you can simulate QRIS payments:

```typescript
const payment = await xendit.qris().simulate('qr_123', {
  amount: 50000,
})

console.log(payment.status) // 'COMPLETED'
console.log(payment.amount)
```

## Displaying QR Codes

### Generate QR Image

You can use any QR code library to generate images from the `qr_string`:

```typescript
import QRCode from 'qrcode'

const qr = await xendit.qris().create({
  external_id: 'order-123',
  type: 'DYNAMIC',
  amount: 50000,
  currency: 'IDR',
})

// Generate QR code image
const qrImage = await QRCode.toDataURL(qr.qr_string)

// Return to frontend
return response.json({
  qrImage,
  amount: qr.amount,
  expiresAt: qr.expires_at,
})
```

### Frontend Integration

```html
<!-- In your HTML template -->
<div id="qrcode"></div>
<script>
  // Using qrcode.js library
  new QRCode(document.getElementById('qrcode'), {
    text: '{{ qrString }}',
    width: 256,
    height: 256,
  })
</script>
```

## Use Cases

### In-Store Payments

```typescript
// Generate static QR for store counter
const storeQR = await xendit.qris().create({
  external_id: `store-${storeId}`,
  type: 'STATIC',
  currency: 'IDR',
})

// Save and display at counter
await saveStoreQR(storeId, storeQR.id, storeQR.qr_string)
```

### Online Checkout

```typescript
// Generate dynamic QR for online order
const orderQR = await xendit.qris().create({
  external_id: `order-${orderId}`,
  type: 'DYNAMIC',
  amount: orderTotal,
  currency: 'IDR',
  metadata: {
    order_id: orderId,
    customer_id: customerId,
  },
})

// Display to customer
return response.json({
  qrString: orderQR.qr_string,
  amount: orderQR.amount,
  expiresAt: orderQR.expires_at,
})
```

## Webhook Events

Listen for QRIS payment events:

```typescript
switch (event.event) {
  case 'qris.payment':
    const { external_id, amount, status } = event.data
    
    if (status === 'COMPLETED') {
      await processPayment(external_id, amount)
    }
    break
}
```

## QR Code Lifecycle

```
CREATED → ACTIVE → [PAID] → COMPLETED
   ↓
INACTIVE (if manually deactivated)
```

## Error Handling

```typescript
import { XenditValidationError } from '@rikology/adonisjs-xendit'

try {
  const qr = await xendit.qris().create({
    external_id: 'order-123',
    type: 'DYNAMIC',
    amount: -100, // Invalid: negative amount
    currency: 'IDR',
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Invalid amount:', error.message)
  }
}
```
