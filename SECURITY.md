# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| 0.x     | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within adonisjs-xendit, please send an email to [rikoriswandha@gmail.com](mailto:rikoriswandha@gmail.com).

Please do NOT open public issues for security vulnerabilities.

## What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its impact
- **Fix Timeline**: We aim to provide a fix within 7 days for critical vulnerabilities and 30 days for non-critical ones
- **Disclosure**: We will coordinate with you on the disclosure timeline and credit you for the discovery (if desired)

## Security Best Practices

When using this package:

1. **Never commit API keys** - Always use environment variables
2. **Use HTTPS in production** - Ensure your callback URLs use HTTPS
3. **Verify webhooks** - Always verify webhook signatures using `XenditWebhook.verify()`
4. **Keep dependencies updated** - Regularly update to the latest version
5. **Use sandbox for testing** - Always use the sandbox environment for development and testing

## Security Features

This package includes several security features:

- **HMAC-SHA256 webhook verification** with timing-safe comparison
- **Environment-based configuration** for API keys
- **No sensitive data logging** - API keys and tokens are never logged
- **Idempotency support** for safe retry of requests
