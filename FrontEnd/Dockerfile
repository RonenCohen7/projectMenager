#Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_BASE=/
ARG VITE_API_URL=/api/
ENV VITE_API_URL=$VITE_API_URL
RUN npx tsc -b && npx vite build --base="$VITE_BASE"


#Serve
FROM nginx:1.27-alpine

COPY nginx/security-headers.conf nginx/app-locations.conf /etc/nginx/snippets/

COPY nginx/http.conf /etc/nginx/conf.d/default.conf

COPY nginx/tls.conf /etc/nginx/tls.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443
