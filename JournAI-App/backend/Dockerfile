FROM node:20-bookworm-slim

WORKDIR /app

# Install system dependencies
# - python3, make, g++: Required for building native modules
# - curl: For health checks
# - postgresql-client: For database migrations (optional)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI v2 for S3 access
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip ./aws

# Install app dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create non-root user and set permissions
RUN groupadd -g 10001 appuser \
    && useradd -u 10001 -g 10001 -m -s /sbin/nologin appuser \
    && mkdir -p /app/data \
    && chown -R 10001:10001 /app

# Switch to non-root user
USER 10001:10001

# Environment variables
# Note: Sensitive values should come from Kubernetes secrets
ENV NODE_ENV=production \
    PORT=3000 \
    # Remove local file storage related env vars - using S3
    # Add any other non-sensitive configuration
    NODE_OPTIONS="--max-old-space-size=512"

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["node", "src/server.js"]