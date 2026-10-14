# Security Policy

## Supported Versions

Security updates and patches are applied to the active `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We prioritize the security and privacy of ZMotion's users. If you discover a potential vulnerability, please report it responsibly:

1. **Do not create a public GitHub issue.**
2. Send an email to the project maintainer: **Shameer TM** via [LinkedIn Profile](https://www.linkedin.com/in/shameerion).
3. Include:
   - Description of the vulnerability.
   - Proof-of-concept steps or code.
   - Impact assessment.
   - Target browser and operating system.
4. We will acknowledge receipt within 48 hours and work with you on a coordinated disclosure timeline.

## Security Architecture Principles

- **Zero Remote Ingestion**: No server accepts media uploads from this repository.
- **Strict Client-Side Sandboxing**: All computer vision inference occurs in sandboxed WebAssembly.
- **Dependency Hygiene**: Dependencies are audited regularly using `npm audit` and kept up-to-date with minimal third-party surface area.
