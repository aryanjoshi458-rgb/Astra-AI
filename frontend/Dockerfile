# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Disable npm SSL warnings if proxy issues are present in container
RUN npm config set strict-ssl false

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
