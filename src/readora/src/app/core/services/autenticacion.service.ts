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
  }  checkAuthentication(): void {
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
        // Verificar explícitamente si la respuesta indica que el usuario está autenticado
        const isAuth = response && response.isAuthenticated === true;
        this.isAuthenticated.next(isAuth);
        console.log('Estado de autenticación actualizado:', isAuth);
        
        // Si el backend nos proporciona un token en la respuesta, lo almacenamos
        // para compatibilidad con los componentes que lo utilizan
        if (response && response.token) {
          this.token = response.token;
        }
      });
  }  authenticateUsuario(usuario: string, contrasenna: string): Observable<any> {
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
        if (response && response.mensage === "Authentication successful") {
          console.log('Autenticación exitosa, actualizando estado');
          this.isAuthenticated.next(true);
          
          // Verificar el estado actual llamando a checkAuthentication
          setTimeout(() => this.checkAuthentication(), 500);
          
          // Si el backend devuelve un token en la respuesta, lo guardamos para compatibilidad
          if (response && response.token) {
            this.token = response.token;
          }
        }
      })
    );
  }  isLoggedIn(): Observable<boolean> {
    // Al suscribirse a este observable, verificamos primero el estado de autenticación
    this.checkAuthentication();
    return this.isAuthenticated.asObservable();
  }  logout(): void {
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
  }  getUserInfo(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/user-info`, { withCredentials: true });
  }  setToken(token: string): void {
    this.token = token;
    this.isAuthenticated.next(!!token);
  }  getToken(): string | null {
    if (!this.token && this.isAuthenticated.getValue()) {
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
