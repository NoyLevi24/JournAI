FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

FROM nginx:1.27-alpine
# Create non-root user 10001 and adjust permissions for nginx runtime
RUN addgroup -g 10001 appuser \
    && adduser -D -H -u 10001 -G appuser appuser \
    && mkdir -p /var/cache/nginx /var/run/nginx \
    && chown -R 10001:10001 /var/cache/nginx /var/run/nginx /etc/nginx /usr/share/nginx/html

COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

USER 10001:10001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
