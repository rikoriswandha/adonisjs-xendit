# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-25

### Fixed

- **`parseEvent()` now accepts flat Xendit callbacks.** Xendit sends two webhook shapes: an envelope (`{ event, data }`) and a flat resource payload (QR code, e-wallet, VA, disbursement callbacks). The previous implementation rejected flat payloads, causing QRIS/e-wallet payments to be silently dropped. Flat payloads are now normalised to `{ event, data }` where `data` wraps the entire flat object and `event` is inferred from top-level fields (`payment.succeeded`, `payment.failed`, `payment.callback`, `disbursement.completed`, `disbursement.failed`).
- **`verify()` replaced by `verifyCallbackToken()`.** The old `verify()` used HMAC-SHA256 of the payload body, but Xendit webhook verification is a plain constant-time comparison of the `x-callback-token` header against the configured verification token. The new method uses `crypto.timingSafeEqual` for a constant-time token comparison.

### Breaking Changes

- `XenditWebhook.verify()` removed — use `XenditWebhook.verifyCallbackToken(receivedToken, callbackToken)` instead.
- `parseEvent()` no longer throws on flat payloads — it now normalises them. Code that relied on the throw for unknown shapes will need to check `event.event` instead.

## [1.0.0] - 2025-01-15

### Added

- Initial stable release
- **9 Payment Products**: Invoice, Virtual Account, E-Wallet, QRIS, Retail Outlet, Credit Card, Direct Debit, Disbursement, Balance
- **Type-safe API**: Full TypeScript types for all request/response shapes
- **IoC Container Integration**: `xendit.manager` singleton registered via provider
- **Webhook Helpers**: Built-in webhook payload parsing with callback token verification
- **Configurable**: `node ace configure` prompts for API key and generates config
- **Error Handling**: Custom `XenditException` with structured error responses
- **Idempotency Support**: Optional idempotency keys for safe retries
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
- **Comprehensive Tests**: 100+ test cases with >80% code coverage

### Security

- HMAC-SHA256 webhook signature verification with timing-safe comparison
- Secure API key handling through environment variables
- No sensitive data logging

[1.1.0]: https://github.com/rikoriswandha/adonisjs-xendit/releases/tag/v1.1.0
 [1.0.0]: https://github.com/rikoriswandha/adonisjs-xendit/releases/tag/v1.0.0
