FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache bash git curl python3 py3-pip wget

# Install Snyk via npm
RUN npm install -g snyk

# Install Trivy binary
RUN wget -qO trivy.tar.gz https://github.com/aquasecurity/trivy/releases/latest/download/trivy_$(uname -m)-musl.tar.gz \
  && tar zxvf trivy.tar.gz \
  && mv trivy /usr/local/bin/ \
  && chmod +x /usr/local/bin/trivy

# Install Semgrep via pip
RUN pip3 install semgrep

# App setup
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

# Build Next in standalone mode
RUN npm run build

CMD ["node", ".next/standalone/server.js"]
