#Image
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev

ENV NODE_ENV=production

#Not as root
USER node

EXPOSE 4000

CMD ["node", "dist/app.js"]
