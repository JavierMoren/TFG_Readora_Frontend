import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AutenticacionService);
  const token = authService.getToken();

  // Si hay un token de autenticación, lo añadimos al header
  if (token) {
    // Clonamos la petición para no modificar la original
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // Si no hay token, dejamos pasar la petición sin modificar
  return next(req);
};