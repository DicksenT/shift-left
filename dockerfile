# === Stage 1: Build ===
FROM node:20-alpine AS builder

ENV NODE_OPTIONS="--max_old_space_size=2048"

# Install base dependencies
RUN apk add --no-cache git bash curl python3 py3-pip wget

# Install scanners
RUN npm install -g snyk

RUN wget -q https://github.com/aquasecurity/trivy/releases/download/v0.63.0/trivy_0.63.0_Linux-64bit.tar.gz \
  && tar -xzf trivy_0.63.0_Linux-64bit.tar.gz \
  && mv trivy /usr/local/bin/ \
  && chmod +x /usr/local/bin/trivy \
  && rm trivy_0.63.0_Linux-64bit.tar.gz LICENSE README.md

RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install semgrep \
  && ln -s /opt/venv/bin/semgrep /usr/local/bin/semgrep

# Build your app
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# === Stage 2: Runtime ===
FROM node:20-alpine

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max_old_space_size=2048"

# Runtime deps
RUN apk add --no-cache git

# Snyk CLI (binary + node_modules)
COPY --from=builder /usr/local/bin/snyk /usr/local/bin/snyk
COPY --from=builder /usr/local/lib/node_modules/snyk /usr/local/lib/node_modules/snyk
ENV PATH="/usr/local/lib/node_modules/snyk/bin:$PATH"


# Other scanners
COPY --from=builder /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=builder /usr/local/bin/semgrep /usr/local/bin/semgrep
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH:$PATH"

# Next.js standalone output
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./

# (Optional) Clean up to reduce image size
RUN rm -rf /root/.npm /tmp/*

EXPOSE 3000
CMD ["node", "server.js"]
