FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
ARG VITE_MINECRAFT_SERVER_IP
ENV VITE_MINECRAFT_SERVER_IP=$VITE_MINECRAFT_SERVER_IP
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
