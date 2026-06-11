# Error Handling

Handle errors gracefully when interacting with the Xendit API.

## Error Types

The package provides specific error classes for different HTTP status codes:

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `XenditValidationError` | 400 | Invalid request parameters |
| `XenditAuthenticationError` | 401 | Invalid API key or unauthorized |
| `XenditNotFoundError` | 404 | Resource not found |
| `XenditConflictError` | 409 | Duplicate external ID or conflict |
| `XenditRateLimitError` | 429 | Rate limit exceeded |
| `XenditServerError` | 500+ | Xendit server error |
| `XenditNetworkError` | 0 | Network or timeout error |

All errors extend `XenditException` which provides:

- `status` — HTTP status code
- `code` — Xendit error code
- `message` — Human-readable error message
- `rawResponse` — Full error response body

## Basic Error Handling

### Try-Catch Pattern

```typescript
import { XenditException } from '@rikology/adonisjs-xendit'

try {
  const invoice = await xendit.invoice().create({
    external_id: 'order-123',
    amount: 50000,
    description: 'Test invoice',
  })
} catch (error) {
  if (error instanceof XenditException) {
    console.log('Status:', error.status)
    console.log('Code:', error.code)
    console.log('Message:', error.message)
    console.log('Response:', error.rawResponse)
  } else {
    console.log('Unexpected error:', error)
  }
}
```

### Specific Error Handling

```typescript
import {
  XenditValidationError,
  XenditAuthenticationError,
  XenditNotFoundError,
  XenditConflictError,
  XenditRateLimitError,
  XenditServerError,
  XenditNetworkError,
} from '@rikology/adonisjs-xendit'

try {
  const invoice = await xendit.invoice().create({
    external_id: 'order-123',
    amount: 50000,
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    // Handle validation errors (400)
    console.log('Validation failed:', error.message)
    
    if (error.rawResponse?.errors) {
      for (const err of error.rawResponse.errors) {
        console.log(`${err.path}: ${err.message}`)
      }
    }
  } else if (error instanceof XenditAuthenticationError) {
    // Handle authentication errors (401)
    console.log('Authentication failed:', error.message)
    // Alert admin about API key issues
  } else if (error instanceof XenditNotFoundError) {
    // Handle not found errors (404)
    console.log('Resource not found:', error.message)
  } else if (error instanceof XenditConflictError) {
    // Handle conflict errors (409)
    console.log('Conflict:', error.message)
    // Generate new external ID and retry
  } else if (error instanceof XenditRateLimitError) {
    // Handle rate limit errors (429)
    console.log('Rate limit exceeded:', error.message)
    // Implement backoff and retry
  } else if (error instanceof XenditServerError) {
    // Handle server errors (500+)
    console.log('Server error:', error.message)
    // Retry with exponential backoff
  } else if (error instanceof XenditNetworkError) {
    // Handle network errors (0)
    console.log('Network error:', error.message)
    // Retry the request
  }
}
```

## Common Error Scenarios

### Validation Errors (400)

```typescript
try {
  const invoice = await xendit.invoice().create({
    external_id: 'order-123',
    amount: -100, // Invalid: negative amount
  })
} catch (error) {
  if (error instanceof XenditValidationError) {
    // error.code: 'API_VALIDATION_ERROR'
    // error.message: 'amount must be positive'
    // error.rawResponse.errors: [{ path: 'amount', message: 'must be positive' }]
  }
}
```

### Authentication Errors (401)

```typescript
try {
  const invoice = await xendit.invoice().create({
    external_id: 'order-123',
    amount: 50000,
  })
} catch (error) {
  if (error instanceof XenditAuthenticationError) {
    // error.code: 'UNAUTHORIZED'
    // error.message: 'Invalid API key'
    
    // Alert admin
    await sendAlert('API key invalid or expired')
  }
}
```

### Not Found Errors (404)

```typescript
try {
  const invoice = await xendit.invoice().getById('invalid-id')
} catch (error) {
  if (error instanceof XenditNotFoundError) {
    // error.code: 'NOT_FOUND'
    // error.message: 'Invoice not found'
    
    // Handle missing resource
    return response.notFound('Invoice not found')
  }
}
```

### Conflict Errors (409)

```typescript
try {
  const invoice = await xendit.invoice().create({
    external_id: 'duplicate-id',
    amount: 50000,
  })
} catch (error) {
  if (error instanceof XenditConflictError) {
    // error.code: 'DUPLICATE_EXTERNAL_ID'
    // error.message: 'External ID already used'
    
    // Generate new ID and retry
    const newId = `order-${Date.now()}`
    const invoice = await xendit.invoice().create({
      external_id: newId,
      amount: 50000,
    })
  }
}
```

### Rate Limit Errors (429)

```typescript
async function createWithRetry(data: CreateInvoiceRequest, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await xendit.invoice().create(data)
    } catch (error) {
      if (error instanceof XenditRateLimitError && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}
```

### Network Errors

```typescript
try {
  const invoice = await xendit.invoice().create({
    external_id: 'order-123',
    amount: 50000,
  })
} catch (error) {
  if (error instanceof XenditNetworkError) {
    if (error.code === 'TIMEOUT') {
      console.log('Request timed out')
      // Retry with longer timeout
    } else {
      console.log('Network error:', error.message)
      // Check connectivity and retry
    }
  }
}
```

## Error Response Structure

```typescript
interface XenditApiError {
  error_code: string
  message: string
  status_code?: number
  errors?: XenditValidationErrorDetail[]
}

interface XenditValidationErrorDetail {
  path: string
  message: string
}
```

Example error response:

```json
{
  "error_code": "API_VALIDATION_ERROR",
  "message": "amount must be positive",
  "status_code": 400,
  "errors": [
    {
      "path": "amount",
      "message": "must be positive"
    }
  ]
}
```

## Best Practices

### 1. Always Catch XenditException

```typescript
try {
  // Xendit API call
} catch (error) {
  if (error instanceof XenditException) {
    // Handle known Xendit errors
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error)
  }
}
```

### 2. Log Errors

```typescript
try {
  const invoice = await xendit.invoice().create(data)
} catch (error) {
  if (error instanceof XenditException) {
    logger.error({
      status: error.status,
      code: error.code,
      message: error.message,
      rawResponse: error.rawResponse,
    }, 'Xendit API error')
  }
}
```

### 3. Return User-Friendly Messages

```typescript
try {
  const invoice = await xendit.invoice().create(data)
  return response.json(invoice)
} catch (error) {
  if (error instanceof XenditValidationError) {
    return response.badRequest({
      error: 'Validation failed',
      details: error.rawResponse?.errors,
    })
  } else if (error instanceof XenditAuthenticationError) {
    return response.unauthorized({
      error: 'Payment service unavailable',
    })
  } else {
    return response.internalServerError({
      error: 'An error occurred while processing your payment',
    })
  }
}
```

### 4. Implement Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isRetryable =
        error instanceof XenditRateLimitError ||
        error instanceof XenditServerError ||
        error instanceof XenditNetworkError

      if (isRetryable && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Usage
const invoice = await withRetry(() =>
  xendit.invoice().create(data)
)
```
