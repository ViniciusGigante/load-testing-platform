FROM node:18-alpine

WORKDIR /app

COPY backend/*.json ./

RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm","start"]