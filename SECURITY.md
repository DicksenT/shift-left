# 🛡️ Security Policy

## 📣 Reporting a Vulnerability

If you discover a security vulnerability, please open an issue or email me at tandicksen@gmail.com.

---

## 🔍 Scanners Used

Shift-Left integrates the following static and dynamic scanners:

- [Snyk](https://snyk.io) – dependency and license scanning
- [Trivy](https://aquasecurity.github.io/trivy) – Docker, IaC, secret scanning
- [Semgrep](https://semgrep.dev) – static code analysis

All scan results are normalized and visualized before code is deployed.

---

## 🔐 Project-Level Safeguards

- All CLI tools run in **ephemeral containers** with no file persistence
- No GitHub tokens or secrets are stored on the server
- Streamed logs are sanitized and not retained post-request

---

## ✋ Disclaimer

Shift-Left is a learning project. Use responsibly.
