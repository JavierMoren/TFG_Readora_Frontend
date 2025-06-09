# Readora

#### Curso Escolar 2024-2025
#### Autor: [Javier Moreno Salas](https://github.com/JavierMoren)
#### Tutor: [Antonio Gabriel González Casado](https://github.com/antonio-gabriel-gonzalez-casado)
#### Fecha de Inicio: 11-03-2025
#### Fecha de Finalización: 10-06-2025

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

## Estructura del Frontend

El proyecto frontend está implementado con Angular y organizado de la siguiente manera:

```
src/readora/
├── Dockerfile       # Configuración para contenedorización
├── angular.json     # Configuración de Angular
├── package.json     # Dependencias y scripts de npm
└── src/
    ├── app/         # Componentes y servicios de la aplicación
    ├── assets/      # Recursos estáticos (imágenes, logos)
    └── environments/ # Configuraciones por entorno
```

### Componentes principales

- **core/**: Servicios, guardias e interceptores fundamentales
- **feature/**: Módulos de características de la aplicación
- **layout/**: Componentes de estructura (cabecera, pie de página)
- **models/**: Interfaces y clases para los modelos de datos
- **shared/**: Componentes reutilizables

### Tecnologías utilizadas

- Angular 19.1.0
- Bootstrap 5.3.5
- RxJS 7.8.0
- NGX Sonner
- JWT Decode
- SweetAlert2

