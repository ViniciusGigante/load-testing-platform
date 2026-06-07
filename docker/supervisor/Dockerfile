FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY dashboard/package*.json ./

RUN npm install

COPY dashboard .

EXPOSE 4000

CMD ["npm", "start"]