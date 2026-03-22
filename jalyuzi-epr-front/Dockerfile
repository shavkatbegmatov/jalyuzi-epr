# ========== BUILD STAGE ==========
FROM node:20-alpine AS build

WORKDIR /app

# Dependency fayllar (cache uchun)
COPY package.json package-lock.json ./
RUN npm ci

# Source kodni kopiyalaymiz va build qilamiz
COPY . .
RUN npm run build

# ========== RUN STAGE ==========
FROM nginx:alpine

# Nginx konfiguratsiya
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build natijasini kopiyalaymiz
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
