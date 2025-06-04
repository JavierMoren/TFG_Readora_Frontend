# Etapa de compilación
FROM node:20-alpine AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Configura npm para reducir uso de memoria y mejorar rendimiento
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NPM_CONFIG_LOGLEVEL=error
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copia los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instala solo las dependencias de producción y usa un cache específico
RUN npm config set cache /tmp/npm-cache --global && \
    npm ci --prefer-offline --no-audit --no-fund --production=false && \
    npm install -g @angular/cli@19

# Copia solo los archivos necesarios para la construcción
COPY tsconfig*.json ./
COPY angular.json ./
COPY src/ ./src/

# Compila la aplicación para producción con menos workers y en modo production-only
RUN npm run build -- --configuration production --aot --optimization --progress=false

# Etapa de producción con Nginx (imagen más ligera)
FROM nginx:alpine

# Combinación de comandos RUN para reducir las capas de imagen
RUN apk add --no-cache bash && \
    mkdir -p /uploads

# Uso de ADD en lugar de wget para obtener wait-for-it.sh (según recomendación)
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Copia la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia los archivos compilados desde la etapa de compilación
COPY --from=build /app/dist/readora/browser /usr/share/nginx/html

# Optimización: configuraciones adicionales para Nginx
RUN echo "worker_rlimit_nofile 8192;" >> /etc/nginx/nginx.conf && \
    echo "gzip on; gzip_types text/plain text/css application/javascript application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;" >> /etc/nginx/conf.d/default.conf

EXPOSE 80

# Inicia Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
