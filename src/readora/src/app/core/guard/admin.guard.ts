import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion.service';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AutenticacionService);
  const router = inject(Router);
  
  return authService.getUserInfo().pipe(
    map(userInfo => {
      if (userInfo && 
          userInfo.roles && 
          Array.isArray(userInfo.roles) && 
          userInfo.roles.includes('ROLE_ADMIN')) {
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