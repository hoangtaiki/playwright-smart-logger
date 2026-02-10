# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Active support |
| < 1.0   | ❌ Not supported  |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Playwright Smart Logger, please help us maintain a safe ecosystem by reporting it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities via:
- Email: [security@your-domain.com]
- GitHub Security Advisories (recommended)

### What to Include

Please include the following information in your report:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if you have one)
- Your contact information

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 7 days
- **Status Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

### Disclosure Policy

- We follow responsible disclosure practices
- Security advisories will be published after fixes are available
- We will credit reporters unless they prefer to remain anonymous
- We may offer bug bounties for significant vulnerabilities

### Security Best Practices

When using Playwright Smart Logger:

1. **Keep Dependencies Updated**: Regularly update to the latest version
2. **Review Logs**: Be cautious about logging sensitive information
3. **Environment Variables**: Don't log environment variables that may contain secrets
4. **CI/CD Security**: Use secure practices in your CI/CD pipelines
5. **Access Control**: Restrict access to test reports containing logs

### Scope

This security policy covers:
- The core `playwright-smart-logger` package
- Security issues in dependencies
- Documentation that could lead to security issues

Out of scope:
- Issues in user test code
- General Playwright security issues (report to Playwright directly)
- Node.js or browser security issues

Thank you for helping keep Playwright Smart Logger secure! 🔒