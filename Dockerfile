# syntax=docker/dockerfile:1
# Opción VPS: construye el sitio estático y lo sirve con Nginx.
# (En Hostinger compartido no se usa Docker: GitHub Actions sube dist/ por SSH.)

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://sacacuentas.isai-dev.com
ENV SITE_URL=$SITE_URL
RUN npm test && npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
