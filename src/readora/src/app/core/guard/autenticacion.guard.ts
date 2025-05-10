import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';
import { map, catchError, of } from 'rxjs';

export const autenticacionGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AutenticacionService);
    
    return authService.isLoggedIn().pipe(
        map(isAuthenticated => {
            if (isAuthenticated) {
                return true; 
            }
            
            router.navigate(['/forbidden']);
            return false;
        }),
        catchError(() => {
            router.navigate(['/forbidden']);
            return of(false);
        })
    );
};
