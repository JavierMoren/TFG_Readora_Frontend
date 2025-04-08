# Imagen base con Node.js versión 20
FROM node:20

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instala Angular CLI globalmente y las dependencias del proyecto
RUN npm install -g @angular/cli && npm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto 4200 para desarrollo de Angular
EXPOSE 4200

# Comando para iniciar el servidor de desarrollo de Angular
CMD ["ng", "serve", "--host", "0.0.0.0"]
