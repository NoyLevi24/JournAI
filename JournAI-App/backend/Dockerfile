FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Create non-root user and set permissions for runtime writable paths
# Use a fixed UID/GID for compatibility with Kubernetes securityContext
RUN groupadd -g 10001 appuser \
    && useradd -u 10001 -g 10001 -m -s /sbin/nologin appuser \
    && mkdir -p /app/uploads /app/data \
    && chown -R 10001:10001 /app

# Drop root
USER 10001:10001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV METRICS_PORT=9091

# Expose application and metrics ports
EXPOSE 3000 9091

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Default command
CMD ["node", "src/server.js"]
