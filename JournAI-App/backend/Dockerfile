FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Create non-root user and set permissions
RUN groupadd -g 10001 appuser \
    && useradd -u 10001 -g 10001 -m -s /sbin/nologin appuser \
    && mkdir -p /app/uploads /app/data \
    && chown -R 10001:10001 /app \
    && chmod 755 /app/uploads

# Switch to non-root user
USER 10001:10001

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/app/uploads

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Default command
CMD ["node", "src/server.js"]