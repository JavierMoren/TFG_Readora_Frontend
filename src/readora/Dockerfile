# Etapa de compilación
FROM node:20 AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instala Angular CLI globalmente y las dependencias del proyecto
RUN npm install -g @angular/cli && npm install

# Copia el resto del código fuente
COPY . .

# Compila la aplicación para producción
RUN ng build --configuration production

# Etapa de producción con Nginx
FROM nginx:stable-alpine

# Instala wget para descargar wait-for-it
RUN apk add --no-cache wget bash

# Descarga wait-for-it.sh y hazlo ejecutable
RUN wget -O /wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /wait-for-it.sh

# Copia la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia los archivos compilados desde la etapa de compilación
COPY --from=build /app/dist/readora/browser /usr/share/nginx/html

# Crea el directorio para uploads si no existe
RUN mkdir -p /uploads

# Crea el directorio para los certificados SSL
RUN mkdir -p /etc/nginx/ssl

# Expone los puertos 80 (HTTP) y 443 (HTTPS)
EXPOSE 80
EXPOSE 443

# Inicia Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
