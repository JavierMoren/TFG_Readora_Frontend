import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion.service';
import { inject } from '@angular/core';

export const autenticacionGuard: CanActivateFn = (route, state) => {
      // Inyecta el servicio de autenticación
      const authService = inject(AutenticacionService);

      // Verifica si el usuario tiene un token válido
      const token = authService.getToken();
      if (token) {
          return true; // Permite la navegación si el token existe
      }
  
      // Redirige al login si no hay token
      const router = inject(Router);
      router.navigate(['/forbidden']); // Redirige a la página 403
      return false; // Bloquea la navegación
};
