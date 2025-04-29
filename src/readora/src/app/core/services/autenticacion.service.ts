import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, throwError, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AutenticacionService {
  
  private apiUrl = `${environment.apiUrl}/v1/authenticate`;
  private logoutUrl = `${environment.apiUrl}/v1/logout`;
  private checkAuthUrl = `${environment.apiUrl}/v1/check-auth`;
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private token: string | null = null; // Para compatibilidad con componentes existentes

  constructor(private http: HttpClient, private router: Router) {
    // Comprobar si el usuario está autenticado al inicializar el servicio
    this.checkAuthentication();
  }

  /**
   * Verifica si hay una sesión autenticada activa consultando al servidor
   * Esta función se puede llamar en cualquier momento para refrescar el estado
   */
  checkAuthentication(): void {
    // Consultar al backend sobre el estado de autenticación utilizando las cookies
    this.http.get<any>(this.checkAuthUrl, { withCredentials: true })
      .pipe(
        catchError(() => {
          // Si hay un error, asumimos que no está autenticado
          this.isAuthenticated.next(false);
          this.token = null;
          return of(false);
        })
      )
      .subscribe(response => {
        this.isAuthenticated.next(!!response);
        // Si el backend nos proporciona un token en la respuesta, lo almacenamos
        // para compatibilidad con los componentes que lo utilizan
        if (response && response.token) {
          this.token = response.token;
        }
      });
  }

  /**
   * Método para autenticar al usuario.
   * @param username - Nombre de usuario ingresado.
   * @param password - Contraseña ingresada.
   * @returns Observable que emite un objeto con el resultado de la autenticación
   */
  authenticateUsuario(usuario: string, contrasenna: string): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      { usuario, contrasenna },
      { 
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true // Importante para que se envíen y reciban cookies
      }
    ).pipe(
      tap((response) => {
        // Cuando la autenticación es exitosa, actualizamos el estado
        this.isAuthenticated.next(true);
        // Si el backend devuelve un token en la respuesta, lo guardamos para compatibilidad
        if (response && response.token) {
          this.token = response.token;
        }
      })
    );
  }

  /**
   * Devuelve un observable que emite el estado de autenticación
   * @returns Observable<boolean>
   */
  isLoggedIn(): Observable<boolean> {
    // Al suscribirse a este observable, verificamos primero el estado de autenticación
    this.checkAuthentication();
    return this.isAuthenticated.asObservable();
  }

  /**
   * Método para cerrar la sesión del usuario.
   * Elimina la cookie solicitando al backend y redirige al usuario a la página de inicio.
   */
  logout(): void {
    // Llamar al endpoint de logout para invalidar la cookie del lado del servidor
    this.http.post<any>(this.logoutUrl, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.isAuthenticated.next(false);
          this.token = null;
          this.router.navigate(['/']);
        },
        error: () => {
          // Incluso si hay un error, limpiamos el estado local
          this.isAuthenticated.next(false);
          this.token = null;
          this.router.navigate(['/']);
        }
      });
  }

  /**
   * Obtiene información del usuario decodificando el JWT desde una API segura
   * @returns Observable con la información del usuario
   */
  getUserInfo(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/user-info`, { withCredentials: true });
  }

  /**
   * Guarda el token JWT para compatibilidad con componentes existentes
   * @param token - El token JWT a guardar
   */
  setToken(token: string): void {
    this.token = token;
    this.isAuthenticated.next(!!token);
  }

  /**
   * Obtiene el token JWT actual. Si no existe, intenta obtenerlo del servidor
   * @returns El token JWT o null si no existe
   */
  getToken(): string | null {
    // Si no tenemos token en memoria, pero estamos autenticados, 
    // podríamos verificar de nuevo con el servidor
    if (!this.token && this.isAuthenticated.getValue()) {
      // Hacemos una llamada síncrona para intentar obtener el token actualizado
      this.http.get<any>(this.checkAuthUrl, { withCredentials: true })
        .subscribe(response => {
          if (response && response.token) {
            this.token = response.token;
          }
        });
    }
    return this.token;
  }
}
