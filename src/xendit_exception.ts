import type { XenditApiError } from './types.ts'

export class XenditException extends Error {
  /**
   * HTTP status code or 0 for network errors
   */
  readonly status: number

  /**
   * Xendit error code (e.g. 'INVALID_AMOUNT', 'UNAUTHORIZED')
   */
  readonly code: string

  /**
   * The raw JSON response body from Xendit API, if available
   */
  readonly rawResponse?: XenditApiError

  constructor(status: number, code: string, message: string, rawResponse?: XenditApiError) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.rawResponse = rawResponse
  }
}

export class XenditValidationError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(400, code, message, rawResponse)
  }
}

export class XenditAuthenticationError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(401, code, message, rawResponse)
  }
}

export class XenditNotFoundError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(404, code, message, rawResponse)
  }
}

export class XenditConflictError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(409, code, message, rawResponse)
  }
}

export class XenditRateLimitError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(429, code, message, rawResponse)
  }
}

export class XenditServerError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(500, code, message, rawResponse)
  }
}

export class XenditNetworkError extends XenditException {
  constructor(code: string, message: string, rawResponse?: XenditApiError) {
    super(0, code, message, rawResponse)
  }
}
