# Getting Started

This guide will help you get up and running with `@rikology/adonisjs-xendit` in your AdonisJS application.

## Prerequisites

Before you begin, make sure you have:

- Node.js >= 20.0.0 installed
- An AdonisJS v7 application
- A Xendit account (sign up at [xendit.co](https://www.xendit.co/))

## Installation

Install the package using your preferred package manager:

```bash
npm install @rikology/adonisjs-xendit
```

```bash
yarn add @rikology/adonisjs-xendit
```

```bash
pnpm add @rikology/adonisjs-xendit
```

## Configuration

Run the configure command to set up the package:

```bash
node ace configure @rikology/adonisjs-xendit
```

This command will:

1. **Prompt for your Xendit API key** — Enter your secret key from the Xendit dashboard
2. **Generate `config/xendit.ts`** — Creates the configuration file
3. **Add environment variables** — Adds required variables to your `.env` file:
   - `XENDIT_SECRET_KEY`
   - `XENDIT_ENVIRONMENT`
   - `XENDIT_CALLBACK_TOKEN`
4. **Register the provider** — Adds the provider to `adonisrc.ts`

### Manual Configuration

If you prefer to configure manually, create `config/xendit.ts`:

```typescript
import { defineConfig } from '@rikology/adonisjs-xendit'
import env from '#start/env'

export default defineConfig({
  secretKey: env.get('XENDIT_SECRET_KEY'),
  environment: env.get('XENDIT_ENVIRONMENT', 'sandbox'),
  callbackToken: env.get('XENDIT_CALLBACK_TOKEN'),
  timeoutMs: 30_000,
})
```

Add to your `.env` file:

```env
XENDIT_SECRET_KEY=your_secret_key_here
XENDIT_ENVIRONMENT=sandbox
XENDIT_CALLBACK_TOKEN=your_callback_token_here
```

Add environment validations to `start/env.ts`:

```typescript
XENDIT_SECRET_KEY: Env.schema.string(),
XENDIT_ENVIRONMENT: Env.schema.enum(['sandbox', 'production'] as const),
XENDIT_CALLBACK_TOKEN: Env.schema.string.optional(),
```

Register the provider in `adonisrc.ts`:

```typescript
providers: [
  // ... other providers
  () => import('@rikology/adonisjs-xendit/xendit_provider'),
]
```

## Environment Setup

### Sandbox (Development)

Use the sandbox environment for development and testing:

```env
XENDIT_SECRET_KEY=xnd_development_...
XENDIT_ENVIRONMENT=sandbox
```

### Production

For production, use your live API key:

```env
XENDIT_SECRET_KEY=xnd_production_...
XENDIT_ENVIRONMENT=production
```

## Basic Usage

### Using the IoC Container

The recommended way to use the package is through AdonisJS's IoC container:

```typescript
import { inject } from '@adonisjs/core'
import type { XenditManager } from '@rikology/adonisjs-xendit'

@inject()
export default class PaymentsController {
  constructor(private xendit: XenditManager) {}

  async createInvoice({ request, response }: HttpContext) {
    const { amount, description } = request.only(['amount', 'description'])

    const invoice = await this.xendit.invoice().create({
      external_id: `order-${Date.now()}`,
      amount: Number(amount),
      description,
      invoice_duration: 86400, // 24 hours
    })

    return response.json(invoice)
  }
}
```

### Using Without IoC Container

You can also instantiate the manager directly:

```typescript
import { XenditManager } from '@rikology/adonisjs-xendit'

const manager = new XenditManager({
  secretKey: process.env.XENDIT_SECRET_KEY!,
  environment: 'sandbox',
})

const invoice = await manager.invoice().create({
  external_id: 'order-123',
  amount: 50000,
  description: 'Test invoice',
})
```

## Next Steps

- Learn about [Invoice payments](./invoice.md)
- Explore [Virtual Account](./virtual-account.md) setup
- Implement [E-Wallet](./e-wallet.md) payments
- Set up [Webhook handling](./webhooks.md)
- Review [Error handling](./error-handling.md)
