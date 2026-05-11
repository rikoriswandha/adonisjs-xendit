import type { XenditApiError } from './types.ts'
import {
  XenditAuthenticationError,
  XenditConflictError,
  XenditNetworkError,
  XenditNotFoundError,
  XenditRateLimitError,
  XenditServerError,
  XenditValidationError,
} from './xendit_exception.ts'

const LIBRARY_NAME = 'adonisjs'
const LIBRARY_VERSION = '0.0.0'

export interface XenditHttpClientOptions {
  baseUrl: string
  secretKey: string
  timeoutMs?: number
}

export interface XenditRequestOptions {
  body?: Record<string, unknown>
  idempotencyKey?: string
  headers?: Record<string, string>
}

export class XenditHttpClient {
  readonly #baseUrl: string
  readonly #secretKey: string
  readonly #timeoutMs: number

  constructor(options: XenditHttpClientOptions) {
    this.#baseUrl = options.baseUrl.replace(/\/$/, '')
    this.#secretKey = options.secretKey
    this.#timeoutMs = options.timeoutMs ?? 30000
  }

  async request<T>(method: string, path: string, options?: XenditRequestOptions): Promise<T> {
    const url = `${this.#baseUrl}${path}`
    const headers = new Headers({
      'Authorization': this.#authHeader(),
      'Content-Type': 'application/json',
      ...this.#addTrackingHeaders(),
      ...this.#addIdempotencyHeader(options?.idempotencyKey),
      ...options?.headers,
    })

    const body = options?.body ? JSON.stringify(options.body) : undefined

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.#timeoutMs)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await this.#safeParseJson(response)
        throw this.#mapError(response.status, errorBody)
      }

      const json = await this.#safeParseJson(response)
      return json as T
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new XenditNetworkError('TIMEOUT', `Request timed out after ${this.#timeoutMs}ms`)
      }

      if (
        error instanceof XenditValidationError ||
        error instanceof XenditAuthenticationError ||
        error instanceof XenditNotFoundError ||
        error instanceof XenditConflictError ||
        error instanceof XenditRateLimitError ||
        error instanceof XenditServerError
      ) {
        throw error
      }

      throw new XenditNetworkError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed'
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }

  #authHeader(): string {
    const encoded = Buffer.from(`${this.#secretKey}:`).toString('base64')
    return `Basic ${encoded}`
  }

  #addTrackingHeaders(): Record<string, string> {
    return {
      'xendit-lib': LIBRARY_NAME,
      'xendit-lib-ver': LIBRARY_VERSION,
    }
  }

  #addIdempotencyHeader(idempotencyKey?: string): Record<string, string> {
    if (!idempotencyKey) return {}
    return { 'idempotency-key': idempotencyKey }
  }

  #mapError(status: number, body: XenditApiError | null): Error {
    const code = body?.error_code ?? 'UNKNOWN_ERROR'
    const message = body?.message ?? 'An error occurred'

    switch (status) {
      case 400:
        return new XenditValidationError(code, message, body ?? undefined)
      case 401:
        return new XenditAuthenticationError(code, message, body ?? undefined)
      case 404:
        return new XenditNotFoundError(code, message, body ?? undefined)
      case 409:
        return new XenditConflictError(code, message, body ?? undefined)
      case 429:
        return new XenditRateLimitError(code, message, body ?? undefined)
      default:
        return new XenditServerError(code, message, body ?? undefined)
    }
  }

  async #safeParseJson(response: Response): Promise<XenditApiError | null> {
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return null
    }

    try {
      return (await response.json()) as XenditApiError
    } catch {
      return null
    }
  }
}
