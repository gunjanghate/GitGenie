# Security Policy

## Reporting a Vulnerability

GitGenie is an AI-powered Git assistant that automates commits and pushes.
If you discover a security vulnerability, please report it responsibly.

**Do not open public GitHub issues for security-related reports.**

Instead, please report vulnerabilities by:
- Contacting the maintainers through a private communication channel listed in the repository, or
- Using GitHub’s private security advisory feature (if enabled)

When reporting a vulnerability, please include:
- A clear description of the issue
- Steps to reproduce the behavior
- Any relevant CLI commands or flags used
- The potential impact (e.g., unintended Git operations, credential exposure)

---

## Scope

Security-related issues may include, but are not limited to:
- Authentication or credential handling
- Automated staging, commit, or push behavior
- AI-generated commit message handling (e.g., `--genie` flag)
- Unintended repository, branch, or history modifications
- Any behavior that could lead to data loss or unauthorized access

---

## API Key & Configuration Security

GitGenie may require API keys (for example, when configuring AI-powered features via `gg config`).

To maintain security:
- API keys are **never hardcoded** into the source code
- Keys are stored **locally on the user’s machine** and are not committed to version control
- Sensitive configuration values are expected to be excluded via `.gitignore`
- GitGenie does **not** transmit or log API keys beyond what is required for the configured service
- Users are responsible for keeping their API keys private and rotating them if exposure is suspected

If you believe an API key or sensitive configuration is being handled insecurely, please report it as a security vulnerability.

---

## Responsible Disclosure

Please allow the maintainers reasonable time to investigate and address reported issues before any public disclosure.

We appreciate your efforts in helping keep GitGenie safe, reliable, and secure.
