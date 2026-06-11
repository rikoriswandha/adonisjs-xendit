# Balance

Check your Xendit account balance.

## Overview

The Balance API allows you to query your Xendit account balance in real-time.

## Account Types

| Type | Description |
|------|-------------|
| `CASH` | Available cash balance |
| `HOLDING` | Funds held for pending settlements |
| `TAX` | Tax-related balance |

## Getting Balance

### Total Balance

```typescript
const balance = await xendit.balance().get()
console.log(balance.balance) // Total balance in IDR
```

### Cash Balance

```typescript
const cashBalance = await xendit.balance().getByAccountType('CASH')
console.log(cashBalance.balance)
```

### Holding Balance

```typescript
const holdingBalance = await xendit.balance().getByAccountType('HOLDING')
console.log(holdingBalance.balance)
```

### Tax Balance

```typescript
const taxBalance = await xendit.balance().getByAccountType('TAX')
console.log(taxBalance.balance)
```

## Use Cases

### Dashboard Display

```typescript
export default class DashboardController {
  async getBalances({ response }: HttpContext) {
    const [cash, holding, tax] = await Promise.all([
      xendit.balance().getByAccountType('CASH'),
      xendit.balance().getByAccountType('HOLDING'),
      xendit.balance().getByAccountType('TAX'),
    ])

    return response.json({
      cash: cash.balance,
      holding: holding.balance,
      tax: tax.balance,
      total: cash.balance + holding.balance + tax.balance,
    })
  }
}
```

### Low Balance Alert

```typescript
async function checkBalance() {
  const balance = await xendit.balance().getByAccountType('CASH')
  
  if (balance.balance < 1000000) {
    // Send alert when balance is below 1M IDR
    await sendAlertEmail({
      subject: 'Low Balance Alert',
      body: `Current balance: Rp ${balance.balance.toLocaleString()}`,
    })
  }
}
```

### Payout Validation

```typescript
async function validatePayout(amount: number) {
  const balance = await xendit.balance().getByAccountType('CASH')
  
  if (balance.balance < amount) {
    throw new Error(`Insufficient balance. Available: Rp ${balance.balance.toLocaleString()}`)
  }
  
  return true
}
```
