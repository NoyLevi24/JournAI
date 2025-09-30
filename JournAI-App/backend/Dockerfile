FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy source
COPY backend .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
