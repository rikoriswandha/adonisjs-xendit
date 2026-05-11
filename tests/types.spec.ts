import { test } from '@japa/runner'
import {
  XenditException,
  XenditValidationError,
  XenditAuthenticationError,
  XenditNotFoundError,
  XenditConflictError,
  XenditRateLimitError,
  XenditServerError,
  XenditNetworkError,
} from '../src/xendit_exception.ts'
import type { XenditApiError } from '../src/types.ts'

test.group('XenditException', () => {
  test('create base exception with status, code, message', ({ assert }) => {
    const error = new XenditException(400, 'INVALID_AMOUNT', 'Amount must be positive')

    assert.instanceOf(error, Error)
    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 400)
    assert.equal(error.code, 'INVALID_AMOUNT')
    assert.equal(error.message, 'Amount must be positive')
    assert.equal(error.name, 'XenditException')
    assert.isUndefined(error.rawResponse)
  })

  test('create base exception with rawResponse', ({ assert }) => {
    const raw: XenditApiError = {
      error_code: 'INVALID_AMOUNT',
      message: 'Amount must be positive',
      errors: [{ path: '/amount', message: 'must be positive' }],
    }
    const error = new XenditException(400, 'INVALID_AMOUNT', 'Amount must be positive', raw)

    assert.equal(error.rawResponse, raw)
    assert.deepEqual(error.rawResponse?.errors, raw.errors)
  })
})

test.group('XenditValidationError', () => {
  test('has status 400', ({ assert }) => {
    const error = new XenditValidationError('API_VALIDATION_ERROR', 'Validation failed')

    assert.instanceOf(error, XenditException)
    assert.instanceOf(error, Error)
    assert.equal(error.status, 400)
    assert.equal(error.code, 'API_VALIDATION_ERROR')
    assert.equal(error.name, 'XenditValidationError')
  })

  test('preserve raw response', ({ assert }) => {
    const raw: XenditApiError = {
      error_code: 'API_VALIDATION_ERROR',
      message: 'amount: must be positive',
      errors: [{ path: 'amount', message: 'must be positive' }],
    }
    const error = new XenditValidationError('API_VALIDATION_ERROR', 'Validation failed', raw)

    assert.deepEqual(error.rawResponse, raw)
  })
})

test.group('XenditAuthenticationError', () => {
  test('has status 401', ({ assert }) => {
    const error = new XenditAuthenticationError('UNAUTHORIZED', 'Invalid API key')

    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 401)
    assert.equal(error.code, 'UNAUTHORIZED')
    assert.equal(error.message, 'Invalid API key')
    assert.equal(error.name, 'XenditAuthenticationError')
  })
})

test.group('XenditNotFoundError', () => {
  test('has status 404', ({ assert }) => {
    const error = new XenditNotFoundError('NOT_FOUND', 'Invoice not found')

    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 404)
    assert.equal(error.code, 'NOT_FOUND')
    assert.equal(error.message, 'Invoice not found')
    assert.equal(error.name, 'XenditNotFoundError')
  })
})

test.group('XenditConflictError', () => {
  test('has status 409', ({ assert }) => {
    const error = new XenditConflictError('DUPLETE_EXTERNAL_ID', 'External ID already used')

    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 409)
    assert.equal(error.code, 'DUPLETE_EXTERNAL_ID')
    assert.equal(error.name, 'XenditConflictError')
  })
})

test.group('XenditRateLimitError', () => {
  test('has status 429', ({ assert }) => {
    const error = new XenditRateLimitError('RATE_LIMIT_EXCEEDED', 'Too many requests')

    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 429)
    assert.equal(error.code, 'RATE_LIMIT_EXCEEDED')
    assert.equal(error.name, 'XenditRateLimitError')
  })
})

test.group('XenditServerError', () => {
  test('has status 500', ({ assert }) => {
    const error = new XenditServerError('INTERNAL_SERVER_ERROR', 'Server error')

    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 500)
    assert.equal(error.code, 'INTERNAL_SERVER_ERROR')
    assert.equal(error.name, 'XenditServerError')
  })
})

test.group('XenditNetworkError', () => {
  test('has status 0 for network failures', ({ assert }) => {
    const error = new XenditNetworkError('NETWORK_ERROR', 'fetch failed')

    assert.instanceOf(error, XenditException)
    assert.equal(error.status, 0)
    assert.equal(error.code, 'NETWORK_ERROR')
    assert.equal(error.message, 'fetch failed')
    assert.equal(error.name, 'XenditNetworkError')
  })
})

test.group('Exception chaining', () => {
  test('validation error is caught as XenditException', ({ assert }) => {
    const error = new XenditValidationError('TEST', 'test')

    assert.isTrue(error instanceof XenditException)
    assert.isTrue(error instanceof Error)
  })

  test('all subclasses are instances of XenditException', ({ assert }) => {
    const exceptions = [
      new XenditValidationError('E1', 'm'),
      new XenditAuthenticationError('E2', 'm'),
      new XenditNotFoundError('E3', 'm'),
      new XenditConflictError('E4', 'm'),
      new XenditRateLimitError('E5', 'm'),
      new XenditServerError('E6', 'm'),
      new XenditNetworkError('E7', 'm'),
    ]

    for (const error of exceptions) {
      assert.isTrue(error instanceof XenditException)
      assert.isTrue(error instanceof Error)
      assert.isDefined(error.status)
      assert.isDefined(error.code)
      assert.isDefined(error.message)
    }
  })
})

test.group('JSON parsing', () => {
  test('parse XenditApiError from JSON', ({ assert }) => {
    const raw: XenditApiError = JSON.parse(
      JSON.stringify({
        error_code: 'INVALID_AMOUNT',
        message: 'amount must be positive',
        errors: [{ path: 'amount', message: 'must be positive' }],
      })
    )

    assert.equal(raw.error_code, 'INVALID_AMOUNT')
    assert.equal(raw.message, 'amount must be positive')
    assert.lengthOf(raw.errors!, 1)
    assert.equal(raw.errors![0].path, 'amount')
  })

  test('exception wraps parsed JSON', ({ assert }) => {
    const json = {
      error_code: 'API_VALIDATION_ERROR',
      message: 'external_id: already exists',
    }
    const raw: XenditApiError = JSON.parse(JSON.stringify(json))
    const error = new XenditConflictError('API_VALIDATION_ERROR', 'Conflict', raw)

    assert.equal(error.rawResponse?.error_code, 'API_VALIDATION_ERROR')
    assert.equal(error.rawResponse?.message, 'external_id: already exists')
  })
})
