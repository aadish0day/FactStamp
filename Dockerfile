# ── Dependencies stage ──
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build stage ──
FROM deps AS build
COPY . .
RUN npm run build

# ── Serve stage ──
FROM nginx:1.27-alpine AS serve

# wget is needed for HEALTHCHECK; not included in alpine by default
RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
