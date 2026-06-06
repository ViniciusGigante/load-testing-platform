FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY backend/*.json ./

RUN npm install

COPY backend .

EXPOSE 3000

CMD ["npm","start"]