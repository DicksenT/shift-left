# 🧱 Architecture Overview – Shift-Left

## 📦 System Layout

- **Frontend**: Next.js (App Router), deployed on Vercel
- **Backend API**: Next.js API Routes, deployed on Fly.io via Docker
- **CLI Tools**: Snyk, Trivy, Semgrep (executed via `child_process.exec`)
- **AI**: OpenAI API (explanation + simulated attacks)

## 🔁 Functional Flow

1. User submits GitHub repo URL
2. Server clones repo into a temporary directory
3. Each scanner is executed:
   - Snyk → `snyk test --json`
   - Trivy → `trivy fs --format json`
   - Semgrep → `semgrep --config auto`
4. Results are normalized and streamed to frontend
5. User can:
   - View AI explanation
   - Run "Hack Me" CLI simulation

## 🔐 Security Notes

- All scans run in sandboxed environments
- No data is persisted between requests
- Sensitive output is filtered before render
