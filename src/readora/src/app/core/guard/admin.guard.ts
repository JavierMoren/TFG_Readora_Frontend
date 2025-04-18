import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion.service';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route, state) => {
  // Inyecta el servicio de autenticación
  const authService = inject(AutenticacionService);
  const router = inject(Router);
  
  // Verifica si el usuario tiene un token válido
  const token = authService.getToken();
  
  if (!token) {
    router.navigate(['/forbidden']);
    return false;
  }

  try {
    // Decodifica el token para extraer la información
    const decodedToken: any = jwtDecode(token);
    
    // Verifica si el token tiene roles y si contiene el rol 'ROLE_ADMIN'
    if (decodedToken && decodedToken.roles && Array.isArray(decodedToken.roles)) {
      if (decodedToken.roles.includes('ROLE_ADMIN')) {
        return true; // Usuario es administrador
      }
    }
    
    // Si el usuario no es administrador, redirige a la página forbidden
    router.navigate(['/forbidden']);
    return false;
  } catch (error) {
    console.error('[ADMIN GUARD] [ERROR] Error al verificar el rol de administrador:', error);
    router.navigate(['/forbidden']);
    return false;
  }
};