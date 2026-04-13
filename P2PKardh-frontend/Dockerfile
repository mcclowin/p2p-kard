# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY P2PKardh-frontend/package.json P2PKardh-frontend/package-lock.json ./
RUN npm ci
COPY P2PKardh-frontend/ .
ARG VITE_API_BASE_URL=https://handup-production.up.railway.app
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY P2PKardh-frontend/nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE ${PORT:-80}
ENV PORT=80
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
