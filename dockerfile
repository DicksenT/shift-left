# === Stage 1: Build app ===
FROM node:20-alpine AS builder

ENV NODE_OPTIONS="--max_old_space_size=2048"

RUN apk add --no-cache git bash curl python3 py3-pip wget

# Install Snyk locally
WORKDIR /tools
RUN npm install snyk
ENV PATH="/tools/node_modules/.bin:$PATH"

# Install Trivy binary
RUN wget -q https://github.com/aquasecurity/trivy/releases/download/v0.63.0/trivy_0.63.0_Linux-64bit.tar.gz \
  && tar -xzf trivy_0.63.0_Linux-64bit.tar.gz \
  && mv trivy /usr/local/bin/ \
  && chmod +x /usr/local/bin/trivy \
  && rm trivy_0.63.0_Linux-64bit.tar.gz LICENSE README.md

# Install Semgrep
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
FROM node:20-alpine

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max_old_space_size=2048"

RUN apk add --no-cache git

# Snyk
COPY --from=builder /tools /tools
ENV PATH="/tools/node_modules/.bin:$PATH"

# Trivy + Semgrep
COPY --from=builder /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=builder /usr/local/bin/semgrep /usr/local/bin/semgrep
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH:$PATH"

# Next.js build
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./

# Change port to Koyeb default
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]