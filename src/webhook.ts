import crypto from 'node:crypto'
import type { XenditWebhookEvent } from './types.ts'

export class XenditWebhook {
  static verify(payload: string, callbackToken: string, signature: string): boolean {
    const expected = crypto.createHmac('sha256', callbackToken).update(payload).digest('hex')

    const expectedBuffer = Buffer.from(expected)
    const actualBuffer = Buffer.from(signature)

    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  }

  static parseEvent(payload: string): XenditWebhookEvent {
    const parsed = JSON.parse(payload) as XenditWebhookEvent
    return parsed
  }
}
