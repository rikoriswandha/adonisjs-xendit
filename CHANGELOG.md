# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/rikoriswandha/adonisjs-xendit/releases/tag/v1.0.0
