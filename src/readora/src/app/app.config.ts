import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

// Importaciones para soporte de localización
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeEs from '@angular/common/locales/es';

// Registro del idioma español
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])), 
    provideAnimationsAsync(),
    // Proveedor del idioma español como valor por defecto
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
