import crypto from 'node:crypto'
import type { XenditWebhookEvent } from './types.ts'

/**
 * Heuristic: infer the event name from a flat Xendit callback payload.
 *
 * Xendit sends two callback shapes:
 * 1. Envelope — `{ event, data }` (Payment Request API, invoice webhooks)
 * 2. Flat      — the resource itself with no envelope (legacy QR code, e-wallet,
 *                virtual account, disbursement callbacks)
 *
 * For flat payloads we synthesise an event name from the top-level fields so the
 * downstream handler still sees a uniform `{ event, data }` shape.
 */
function inferFlatEvent(payload: Record<string, unknown>): string {
  const status = typeof payload.status === 'string' ? payload.status : undefined

  // Disbursement callbacks carry an `id` prefixed with "disb_"
  if (typeof payload.id === 'string' && payload.id.startsWith('disb_')) {
    return status === 'FAILED' ? 'disbursement.failed' : 'disbursement.completed'
  }

  // QR code / e-wallet / payment-request flat callbacks carry `payment_method`
  // or `payment_channel` and a top-level `status`.
  if (status === 'PAID' || status === 'SETTLED' || status === 'SUCCEEDED') {
    return 'payment.succeeded'
  }
  if (status === 'EXPIRED' || status === 'FAILED') {
    return 'payment.failed'
  }

  return 'payment.callback'
}

export class XenditWebhook {
  /**
   * Verify the Xendit callback token.
   *
   * Xendit includes a `x-callback-token` header on every webhook. Verification
   * is a plain constant-time comparison of that header against the configured
   * verification token — NOT an HMAC of the body. See:
   * https://docs.xendit.co/docs/integration-security
   */
  static verifyCallbackToken(receivedToken: string, callbackToken: string): boolean {
    if (!receivedToken || !callbackToken) return false
    const a = Buffer.from(receivedToken)
    const b = Buffer.from(callbackToken)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  }

  /**
   * Parse a Xendit webhook payload into a uniform `{ event, data }` shape.
   *
   * Accepts both envelope payloads (`{ event, data }`) and flat resource
   * payloads (QR code, e-wallet, VA, disbursement) which have no envelope.
   * Flat payloads are normalised by wrapping them in `data` and inferring an
   * `event` name from the top-level fields.
   */
  static parseEvent(payload: string): XenditWebhookEvent {
    const parsed = JSON.parse(payload) as unknown

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new TypeError('Invalid Xendit webhook payload: expected a JSON object')
    }

    const record = parsed as Record<string, unknown>

    // Envelope format — already has event + data
    if (typeof record.event === 'string' && 'data' in record) {
      return parsed as XenditWebhookEvent
    }

    // Flat format — normalise to envelope
    const event = inferFlatEvent(record)
    return {
      event: event as XenditWebhookEvent['event'],
      data: record,
    }
  }
}
