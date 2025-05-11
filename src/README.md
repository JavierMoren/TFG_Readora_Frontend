# Readora Frontend

Este directorio contiene el código **Despliegue con Docker Compose**:

- Ver el archivo [docker-compose.yml](/docker-compose.yml) en la raíz del proyecto
- Ejecutar: `docker-compose up -d` desde el directorio raíz
- El frontend estará disponible en: `http://localhost:4200`
- Este método gestiona automáticamente todas las dependencias y el servidor Nginxe del frontend de la aplicación Readora, desarrollado con Angular.

## Estructura del Proyecto Frontend

```
readora/
├── Dockerfile              # Configuración para contenedorización
├── nginx.conf              # Configuración de Nginx para producción
├── angular.json            # Configuración de Angular
├── package.json            # Dependencias y scripts npm
├── tsconfig.json           # Configuración de TypeScript
└── src/
    ├── app/                # Código fuente de la aplicación Angular
    │   ├── app.component.*    # Componente raíz
    │   ├── app.config.ts      # Configuración de la aplicación
    │   ├── app.routes.ts      # Rutas principales
    │   ├── core/              # Funcionalidades centrales
    │   │   ├── guard/         # Guardianes de rutas
    │   │   ├── interceptors/  # Interceptores HTTP
    │   │   └── services/      # Servicios globales
    │   ├── feature/           # Módulos de características
    │   │   ├── autenticacion/ # Autenticación de usuarios
    │   │   ├── autor/         # Gestión de autores
    │   │   ├── biblioteca/    # Biblioteca personal
    │   │   ├── buscador/      # Búsqueda de libros
    │   │   ├── libro/         # Gestión de libros
    │   │   ├── register/      # Registro de usuarios
    │   │   └── usuario/       # Gestión de usuarios
    │   ├── layout/            # Componentes de estructura
    │   │   ├── footer/        # Pie de página
    │   │   ├── header/        # Cabecera
    │   │   └── home/          # Página de inicio
    │   ├── models/            # Interfaces y clases
    │   │   ├── autor/         # Modelos de autor
    │   │   ├── libro/         # Modelos de libro
    │   │   ├── usuario/       # Modelos de usuario
    │   │   └── usuario-libro/ # Relaciones usuario-libro
    │   └── shared/            # Componentes compartidos
    │       └── components/    # Componentes reutilizables
    ├── assets/              # Recursos estáticos
    │   ├── logos/           # Logotipos de la aplicación
    │   ├── placeholders/    # Imágenes de placeholder
    │   └── styles/          # Estilos globales
    ├── environments/        # Configuraciones por entorno
    ├── index.html           # Documento HTML principal
    ├── main.ts              # Punto de entrada de la aplicación
    └── styles.css           # Estilos globales de la aplicación
```

## Configuración y Despliegue

El frontend de Readora está configurado exclusivamente para ser desplegado mediante Docker Compose:

**Despliegue con Docker Compose**:
- Ver el archivo [docker-compose.yml](/docker-compose.yml) en la raíz del proyecto
- Ejecutar: `docker-compose up -d` desde el directorio raíz
- El frontend estará disponible en: `http://localhost:4200`
- Este método gestiona automáticamente todas las dependencias y el servidor Nginx

## Dependencias Principales

- Angular 19.1.0
- Bootstrap 5.3.5
- RxJS 7.8.0
- NGX Sonner
- JWT Decode
- SweetAlert2

## Enlaces a Otros README

- [README Principal del Proyecto](https://github.com/JavierMoren/Proyecto_TFG/blob/main/README.md)
- [README del Backend](https://github.com/JavierMoren/TFG_Readora_Backend/blob/main/README.md)
- [README del Frontend](https://github.com/JavierMoren/TFG_Readora_Frontend/blob/main/README.md)
- [README del código fuente del Backend](https://github.com/JavierMoren/TFG_Readora_Backend/blob/main/src/README.md)
