import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const autenticacionGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    
    // Verificar si existe un token en el localStorage directamente
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // Verificar si el token ha expirado
        const expiryTime = localStorage.getItem('auth_token_expiry');
        if (expiryTime && new Date().getTime() > parseInt(expiryTime)) {
            // Token expirado, redirigir al inicio
            router.navigate(['/']);
            return false;
        }
        return true; // Permite la navegación si el token existe y no está expirado
    }

    // Redirige al login si no hay token
    router.navigate(['/forbidden']); // Redirige a la página 403
    return false; // Bloquea la navegación
};
