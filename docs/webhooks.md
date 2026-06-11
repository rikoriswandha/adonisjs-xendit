# Webhooks

Handle Xendit webhook events securely in your application.

## Overview

Webhooks allow Xendit to notify your application about payment events in real-time. This is essential for:

- Processing successful payments
- Handling failed transactions
- Updating order statuses
- Triggering post-payment actions

## Supported Events

| Event | Description |
|-------|-------------|
| `invoice.paid` | Invoice has been paid |
| `invoice.expired` | Invoice has expired |
| `va.paid` | Virtual account has been paid |
| `disbursement.created` | Disbursement has been created |
| `disbursement.completed` | Disbursement has been completed |
| `disbursement.failed` | Disbursement has failed |
| `ewallet.payment` | E-wallet payment status updated |
| `card_charge.succeeded` | Credit card charge succeeded |
| `card_charge.failed` | Credit card charge failed |
| `qris.payment` | QRIS payment completed |
| `retail_outlet.payment` | Retail outlet payment completed |
| `direct_debit.payment` | Direct debit payment status updated |
| `fva.created` | Fixed virtual account created |
| `recurring_payment.stopped` | Recurring payment stopped |
| `payment_method.activated` | Payment method activated |
| `payment_method.expired` | Payment method expired |

## Setting Up Webhooks

### 1. Configure Callback Token

Set up your callback token in the Xendit dashboard and add it to your `.env`:

```env
XENDIT_CALLBACK_TOKEN=your_callback_token_here
```

### 2. Create Webhook Controller

```typescript
import { HttpContext } from '@adonisjs/core/http'
import { XenditWebhook } from '@rikology/adonisjs-xendit'
import env from '#start/env'

export default class WebhooksController {
  async handle({ request, response }: HttpContext) {
    const payload = JSON.stringify(request.all())
    const signature = request.header('x-callback-token')
    const callbackToken = env.get('XENDIT_CALLBACK_TOKEN')

    // Verify webhook signature
    if (!signature || !XenditWebhook.verify(payload, callbackToken, signature)) {
      return response.forbidden('Invalid webhook signature')
    }

    try {
      // Parse and validate event
      const event = XenditWebhook.parseEvent(payload)

      // Handle event
      await this.handleEvent(event)

      return response.ok('OK')
    } catch (error) {
      console.error('Webhook processing error:', error)
      return response.badRequest('Invalid payload')
    }
  }

  private async handleEvent(event: XenditWebhookEvent) {
    switch (event.event) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data)
        break
      case 'invoice.expired':
        await this.handleInvoiceExpired(event.data)
        break
      case 'va.paid':
        await this.handleVAPaid(event.data)
        break
      case 'disbursement.completed':
        await this.handleDisbursementCompleted(event.data)
        break
      case 'ewallet.payment':
        await this.handleEWalletPayment(event.data)
        break
      case 'card_charge.succeeded':
        await this.handleCardChargeSucceeded(event.data)
        break
      case 'qris.payment':
        await this.handleQRISPayment(event.data)
        break
      case 'retail_outlet.payment':
        await this.handleRetailOutletPayment(event.data)
        break
      case 'direct_debit.payment':
        await this.handleDirectDebitPayment(event.data)
        break
      default:
        console.log(`Unhandled event: ${event.event}`)
    }
  }

  private async handleInvoicePaid(data: any) {
    const { id, external_id, paid_amount } = data
    
    // Update order status
    await Order.query()
      .where('external_id', external_id)
      .update({
        status: 'PAID',
        paid_amount,
        paid_at: new Date(),
      })
    
    // Send confirmation email
    await sendPaymentConfirmation(external_id)
  }

  private async handleInvoiceExpired(data: any) {
    const { external_id } = data
    
    await Order.query()
      .where('external_id', external_id)
      .update({ status: 'EXPIRED' })
  }

  private async handleVAPaid(data: any) {
    const { reference_id, amount, paid_at } = data
    
    await Order.query()
      .where('external_id', reference_id)
      .update({
        status: 'PAID',
        paid_amount: amount,
        paid_at: new Date(paid_at),
      })
  }

  private async handleDisbursementCompleted(data: any) {
    const { external_id } = data
    
    await Disbursement.query()
      .where('external_id', external_id)
      .update({ status: 'COMPLETED' })
  }

  private async handleEWalletPayment(data: any) {
    const { reference_id, status, charge_amount } = data
    
    if (status === 'SUCCEEDED') {
      await Order.query()
        .where('external_id', reference_id)
        .update({
          status: 'PAID',
          paid_amount: charge_amount,
        })
    }
  }

  private async handleCardChargeSucceeded(data: any) {
    const { external_id, amount } = data
    
    await Order.query()
      .where('external_id', external_id)
      .update({
        status: 'PAID',
        paid_amount: amount,
      })
  }

  private async handleQRISPayment(data: any) {
    const { external_id, amount, status } = data
    
    if (status === 'COMPLETED') {
      await Order.query()
        .where('external_id', external_id)
        .update({
          status: 'PAID',
          paid_amount: amount,
        })
    }
  }

  private async handleRetailOutletPayment(data: any) {
    const { external_id, amount, status } = data
    
    if (status === 'COMPLETED') {
      await Order.query()
        .where('external_id', external_id)
        .update({
          status: 'PAID',
          paid_amount: amount,
        })
    }
  }

  private async handleDirectDebitPayment(data: any) {
    const { reference_id, status, amount } = data
    
    if (status === 'SUCCEEDED') {
      await Order.query()
        .where('external_id', reference_id)
        .update({
          status: 'PAID',
          paid_amount: amount,
        })
    }
  }
}
```

### 3. Register Route

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'

router.post('/webhooks/xendit', '#controllers/webhooks_controller.handle')
```

## Security Best Practices

### 1. Always Verify Signatures

Never process webhooks without verifying the signature:

```typescript
const isValid = XenditWebhook.verify(payload, callbackToken, signature)
if (!isValid) {
  return response.forbidden('Invalid signature')
}
```

### 2. Use HTTPS

Always use HTTPS endpoints for webhooks in production.

### 3. Handle Duplicates

Webhooks may be sent multiple times. Implement idempotency:

```typescript
private async handleInvoicePaid(data: any) {
  const { id } = data
  
  // Check if already processed
  const existing = await WebhookLog.findBy('event_id', id)
  if (existing) {
    return // Already processed
  }
  
  // Process payment
  await this.processPayment(data)
  
  // Log webhook
  await WebhookLog.create({
    event_id: id,
    event_type: 'invoice.paid',
    processed_at: new Date(),
  })
}
```

### 4. Return 200 Quickly

Process webhooks asynchronously to avoid timeouts:

```typescript
async handle({ request, response }: HttpContext) {
  // Verify signature
  // ...
  
  // Parse event
  const event = XenditWebhook.parseEvent(payload)
  
  // Queue for processing
  await webhookQueue.add(event)
  
  // Return immediately
  return response.ok('OK')
}
```

### 5. Log All Webhooks

Keep a log of all received webhooks for debugging:

```typescript
await WebhookLog.create({
  event_id: data.id,
  event_type: event.event,
  payload: payload,
  received_at: new Date(),
})
```

## Testing Webhooks

### Local Development

Use ngrok to expose your local server:

```bash
ngrok http 3333
```

Then configure the webhook URL in Xendit dashboard:

```
https://your-ngrok-url.ngrok.io/webhooks/xendit
```

### Sandbox Testing

Xendit provides a sandbox environment for testing:

1. Use sandbox API keys
2. Configure sandbox webhook URL
3. Test various scenarios (success, failure, expiration)

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is accessible
2. Verify HTTPS certificate is valid
3. Check firewall settings
4. Review Xendit dashboard webhook logs

### Invalid Signature

1. Verify callback token is correct
2. Check payload is not modified
3. Ensure signature header is present

### Processing Errors

1. Check application logs
2. Verify database connections
3. Review error tracking (Sentry, etc.)
