# === Stage 1: Builder (Alpine) ===
FROM node:20-alpine3.19 AS builder

ENV NODE_OPTIONS="--max_old_space_size=2048"

# Install tools needed to build and fetch binaries
RUN apk add --no-cache \
    git bash curl wget python3

# Install Snyk
WORKDIR /tools
RUN npm install snyk@latest
ENV PATH="/tools/node_modules/.bin:$PATH"

# Install Trivy
RUN wget -qO /tmp/trivy.tar.gz \
      https://github.com/aquasecurity/trivy/releases/download/v0.63.0/trivy_0.63.0_Linux-64bit.tar.gz && \
    tar -xzf /tmp/trivy.tar.gz -C /tmp && \
    mv /tmp/trivy /usr/local/bin/trivy && \
    chmod +x /usr/local/bin/trivy && \
    rm /tmp/trivy.tar.gz

# Build Next.js app
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# === Stage 2: Runtime (Debian-slim) ===
FROM node:20-slim

ENV NODE_ENV=production \
    NODE_OPTIONS="--max_old_space_size=2048" \
    SEMGREP_CACHE_DIR=/opt/semgrep-cache

# Install Python venv support + curl/git for healthcheck
RUN apt-get update && apt-get install -y \
      python3 python3-venv git curl && \
    rm -rf /var/lib/apt/lists/*

# Create a venv and install Semgrep with memory + job limits
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir semgrep

# Copy Snyk & Trivy from builder
COPY --from=builder /tools /tools
COPY --from=builder /usr/local/bin/trivy /usr/local/bin/trivy

# Expose semgrep and snyk in PATH
ENV PATH="/tools/node_modules/.bin:/opt/venv/bin:$PATH"

# Verify all tools are present at build-time
RUN semgrep --version \
 && snyk --version \
 && trivy --version

# Copy in the built Next.js app
WORKDIR /app
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Drop to non-root user for security
USER node

EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["node", "server.js"]
