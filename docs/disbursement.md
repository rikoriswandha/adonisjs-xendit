# Disbursement

Send money to bank accounts and e-wallets.

## Overview

Disbursements allow you to:

- Send money to bank accounts
- Send money to e-wallets
- Process batch disbursements
- Retrieve available banks

## Supported Channels

### Banks

| Bank Code | Bank Name |
|-----------|-----------|
| `BCA` | Bank Central Asia |
| `BNI` | Bank Negara Indonesia |
| `BRI` | Bank Rakyat Indonesia |
| `MANDIRI` | Bank Mandiri |
| `PERMATA` | Bank Permata |
| `CIMB` | CIMB Niaga |

### E-Wallets

| Channel Code | E-Wallet |
|--------------|----------|
| `OVO` | OVO |
| `DANA` | DANA |
| `LINKAJA` | LinkAja |
| `SHOPEEPAY` | ShopeePay |

## Creating Disbursements

### Bank Transfer

```typescript
const disbursement = await xendit.disbursement().create({
  external_id: 'disb-123',
  amount: 100000,
  bank_code: 'BCA',
  account_holder_name: 'John Doe',
  account_number: '1234567890',
  description: 'Payout for Order #123',
})
```

### E-Wallet Disbursement

```typescript
const disbursement = await xendit.disbursement().create({
  external_id: 'disb-123',
  amount: 50000,
  bank_code: 'OVO',
  account_holder_name: 'John Doe',
  account_number: '081234567890',
  description: 'Refund for Order #123',
})
```

### Disbursement with Email Notifications

```typescript
const disbursement = await xendit.disbursement().create({
  external_id: 'disb-123',
  amount: 100000,
  bank_code: 'BCA',
  account_holder_name: 'John Doe',
  account_number: '1234567890',
  description: 'Monthly salary',
  email_to: ['john@example.com'],
  email_cc: ['hr@example.com'],
})
```

### Disbursement with Idempotency Key

```typescript
const disbursement = await xendit.disbursement().create(
  {
    external_id: 'disb-123',
    amount: 100000,
    bank_code: 'BCA',
    account_holder_name: 'John Doe',
    account_number: '1234567890',
  },
  {
    idempotencyKey: 'unique-key-123',
  }
)
```

## Retrieving Disbursements

### Get by ID

```typescript
const disbursement = await xendit.disbursement().getById('disb_123')
console.log(disbursement.status) // 'PENDING', 'SUCCEEDED', or 'FAILED'
console.log(disbursement.completed_at)
```

## Batch Disbursements

Process multiple disbursements in a single request:

```typescript
const batch = await xendit.disbursement().createBatch({
  reference: 'payroll-jan-2024',
  disbursements: [
    {
      external_id: 'salary-1',
      amount: 5000000,
      bank_code: 'BCA',
      account_holder_name: 'John Doe',
      account_number: '1234567890',
      description: 'January 2024 Salary',
    },
    {
      external_id: 'salary-2',
      amount: 7500000,
      bank_code: 'BNI',
      account_holder_name: 'Jane Doe',
      account_number: '0987654321',
      description: 'January 2024 Salary',
    },
  ],
})

console.log(batch.status) // 'PENDING'
console.log(batch.total_disbursed_amount)
```

## Getting Available Banks

```typescript
const banks = await xendit.disbursement().getAvailableBanks()

// Filter for banks that support disbursements
const availableBanks = banks.filter(bank => bank.can_disburse)

console.log(availableBanks)
// [
//   { name: 'Bank Central Asia', code: 'BCA', can_disburse: true },
//   { name: 'Bank Negara Indonesia', code: 'BNI', can_disburse: true },
// ]
```

## Use Cases

### Payroll Processing

```typescript
const employees = await getEmployees()

const batch = await xendit.disbursement().createBatch({
  reference: `payroll-${new Date().toISOString().slice(0, 7)}`,
  disbursements: employees.map(emp => ({
    external_id: `salary-${emp.id}`,
    amount: emp.salary,
    bank_code: emp.bankCode,
    account_holder_name: emp.accountName,
    account_number: emp.accountNumber,
    description: 'Monthly Salary',
  })),
})

await savePayrollBatch(batch.id, batch.reference)
```

### Marketplace Payouts

```typescript
// Payout to seller
const payout = await xendit.disbursement().create({
  external_id: `payout-${sellerId}-${orderId}`,
  amount: sellerAmount,
  bank_code: sellerBankCode,
  account_holder_name: sellerAccountName,
  account_number: sellerAccountNumber,
  description: `Payout for Order #${orderId}`,
})

await recordPayout(orderId, sellerId, payout.id)
```

### Refunds

```typescript
// Refund to customer's bank account
const refund = await xendit.disbursement().create({
  external_id: `refund-${orderId}`,
  amount: refundAmount,
  bank_code: customerBankCode,
  account_holder_name: customerName,
  account_number: customerAccountNumber,
  description: `Refund for Order #${orderId}`,
})
```

## Disbursement Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Disbursement is being processed |
| `SUCCEEDED` | Funds have been transferred |
| `FAILED` | Transfer failed |

## Webhook Events

Listen for disbursement events:

```typescript
switch (event.event) {
  case 'disbursement.created':
    console.log('Disbursement created:', event.data)
    break
  case 'disbursement.completed':
    await markDisbursementAsCompleted(event.data.id)
    break
  case 'disbursement.failed':
    await handleFailedDisbursement(event.data)
    break
}
```

## Error Handling

```typescript
import { XenditValidationError } from '@rikology/adonisjs-xendit'

try {
  const disbursement = await xendit.disbursement().create({
    external_id: 'disb-123',
    amount: 100000,
    bank_code: 'INVALID_BANK',
    account_holder_name: 'John Doe',
    account_number: '1234567890',
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    console.log('Invalid bank code:', error.message)
  }
}
```
