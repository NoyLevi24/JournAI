FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy source
COPY backend .

# Create non-root user and set permissions for runtime writable paths
# Use a fixed UID/GID for compatibility with Kubernetes securityContext
RUN groupadd -g 10001 appuser \
    && useradd -u 10001 -g 10001 -m -s /sbin/nologin appuser \
    && mkdir -p /app/uploads /app/data \
    && chown -R 10001:10001 /app

# Drop root
USER 10001:10001

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
