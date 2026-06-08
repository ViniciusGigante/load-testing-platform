FROM node:20-alpine AS builder

WORKDIR /app

# copia package.json + package-lock.json para cache de dependências
COPY docker/frontend/package*.json ./
COPY docker/frontend/vite.config.js ./

# instala dependências
RUN npm install

# copia o restante do frontend
COPY frontend ./frontend

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# expõe a porta que o Vite usa (5173 por padrão)
EXPOSE 80

# comando para rodar o Vite dev server
CMD ["nginx", "-g", "daemon off;"]