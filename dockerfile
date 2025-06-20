# === Stage 1: Build app ===
FROM node:20-alpine AS builder

ENV NODE_OPTIONS="--max_old_space_size=2048"

# Dependencies
RUN apk add --no-cache git bash curl python3 py3-pip wget

# Scanner CLIs
RUN npm install -g snyk

RUN wget -q https://github.com/aquasecurity/trivy/releases/download/v0.63.0/trivy_0.63.0_Linux-64bit.tar.gz \
  && tar -xzf trivy_0.63.0_Linux-64bit.tar.gz \
  && mv trivy /usr/local/bin/ \
  && chmod +x /usr/local/bin/trivy \
  && rm trivy_0.63.0_Linux-64bit.tar.gz LICENSE README.md

RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install semgrep \
  && ln -s /opt/venv/bin/semgrep /usr/local/bin/semgrep

# App code
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# === Stage 2: Final runtime ===
# === Stage 2: Final runtime ===
FROM node:20-alpine

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max_old_space_size=2048"

# ✅ Install git for runtime usage (needed for 'git clone')
RUN apk add --no-cache git

# Copy scanner CLIs from builder
COPY --from=builder /usr/local/bin/snyk /usr/local/bin/snyk
COPY --from=builder /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=builder /usr/local/bin/semgrep /usr/local/bin/semgrep
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy built Next app
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./

EXPOSE 3000
CMD ["node", "server.js"]