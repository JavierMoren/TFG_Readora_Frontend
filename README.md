# Readora

#### Curso Escolar 2024-2025
#### Autor: [Javier Moreno Salas](https://github.com/JavierMoren)
#### Tutor: [Antonio Gabriel González Casado](https://github.com/antonio-gabriel-gonzalez-casado)
#### Fecha de Inicio: 11-03-2024
#### Fecha de Finalización: XX-XX-XXXX

## Breve descripción del proyecto

Tras haber navegado mucho en la búsqueda de libros por internet y no estar nada cómodo con ella, esta web nace para ayudar a resolver ese problema, con el objetivo de unificar los libros leídos de una persona y hacer que su búsqueda de libros sea más cómoda.
La idea principal del proyecto es una web que unifique tu universo de lectura, en la cual puedas almacenar tus libros leídos, llevar un control de la lectura y valorar esos libros.

## Objetivo de la aplicación

- **¿Qué va a hacer la aplicación?**
  
La aplicación va a permitir almacenar tus libros leídos, llevar un control de la lectura y valorar esos libros.
- **¿Cuál es su atractivo principal?**

Su atractivo principal y el porqué ha sido creada, es para permitir a las personas que les gusta llevar más control en su vida, unificar los libros leídos y hacer que su búsqueda de libros sea más cómoda.
- **¿Qué problema concreto va a resolver?**
  
Unificar los libros leídos de una persona y hacer que su búsqueda de libros sea más cómoda.
- **¿Qué necesidad va a cubrir?**
  
Ayuda a las personas a organizarse y encontrar libros de una forma más cómoda.

## Estructura del Proyecto

El proyecto Readora está estructurado como una aplicación cliente-servidor, con un frontend desarrollado en Angular y un backend desarrollado en Spring Boot. La estructura del repositorio está organizada de la siguiente manera:

```
Proyecto_TFG/
├── TFG_Readora_Backend/          # Proyecto de API REST (Spring Boot)
│   ├── docs/                     # Documentación del backend
│   └── src/
│       └── readora/              # Código fuente del backend
│           ├── Dockerfile        # Configuración para contenedorización
│           ├── pom.xml           # Dependencias y configuración de Maven
│           └── src/
│               └── main/
│                   ├── java/     # Código Java
│                   └── resources/ # Recursos y configuraciones
│
├── TFG_Readora_Frontend/         # Proyecto de interfaz de usuario (Angular)
│   ├── docs/                     # Documentación del frontend
│   └── src/
│       └── readora/              # Código fuente del frontend
│           ├── Dockerfile        # Configuración para contenedorización
│           ├── angular.json      # Configuración de Angular
│           ├── package.json      # Dependencias y scripts de npm
│           └── src/
│               ├── app/          # Componentes y servicios de la aplicación
│               ├── assets/       # Recursos estáticos (imágenes, logos)
│               └── enviroments/  # Configuraciones de entorno
│
├── certs/                        # Certificados SSL y claves
│   ├── jwt-keystore.jks
│   ├── server.crt/
│   └── server.key/
│
├── uploads/                      # Almacenamiento de archivos subidos por usuarios
│   ├── autor/                    # Imágenes de autores
│   └── libro/                    # Portadas de libros
│
├── docker-compose.yml            # Configuración para desplegar con Docker Compose
└── README.md                     # Documentación principal del proyecto
```

### Frontend (Angular)
El frontend está estructurado siguiendo las buenas prácticas de Angular, con una organización por módulos y características:

- **core/**: Contiene servicios, guardias e interceptores fundamentales
- **feature/**: Módulos de características de la aplicación como autenticación, búsqueda de libros, etc.
- **layout/**: Componentes de estructura como cabecera y pie de página
- **models/**: Interfaces y clases para los modelos de datos
- **shared/**: Componentes reutilizables en toda la aplicación

### Backend (Spring Boot)
El backend implementa una API REST con la siguiente organización:

- **config/**: Configuración de la aplicación, seguridad y componentes
- **controllers/**: Controladores REST que manejan las peticiones HTTP
- **dtos/**: Objetos de transferencia de datos para comunicación cliente-servidor
- **entities/**: Entidades JPA que representan las tablas de la base de datos
- **mappers/**: Clases para mapeo entre entidades y DTOs
- **repositories/**: Interfaces para acceso a datos mediante Spring Data JPA
- **services/**: Implementación de la lógica de negocio
- **utils/**: Clases de utilidad y componentes auxiliares

### Despliegue
La aplicación está preparada para desplegarse mediante Docker y Docker Compose, facilitando la configuración de entornos de desarrollo y producción.

## Enlaces a Otros README

- [README Principal del Proyecto](/README.md)
- [README del Backend](/TFG_Readora_Backend/README.md)
- [README del código fuente del Backend](/TFG_Readora_Backend/src/README.md)
- [README del código fuente del Frontend](/TFG_Readora_Frontend/src/README.md)
