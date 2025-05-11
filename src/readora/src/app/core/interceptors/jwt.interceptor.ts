import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * Interceptor para agregar credenciales a todas las solicitudes HTTP
 * cuando la URL pertenece al dominio de la API.
 * Esto permite que las cookies HttpOnly se envíen automáticamente.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Verificar si la solicitud va hacia nuestra API
  if (req.url.includes('/api/')) {
    // Clonar la petición y añadir withCredentials para enviar cookies automáticamente
    const authReq = req.clone({
      withCredentials: true
    });
    return next(authReq);
  }

  // Si no va hacia la API, dejamos pasar la petición sin modificar
  return next(req);
};