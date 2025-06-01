import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, throwError, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root',
})
export class AutenticacionService {
  readonly apiUrl = `${environment.apiUrl}/v1/authenticate`;
  readonly logoutUrl = `${environment.apiUrl}/v1/logout`;
  readonly checkAuthUrl = `${environment.apiUrl}/v1/check-auth`;
  readonly isAuthenticated = new BehaviorSubject<boolean>(false);
  private token: string | null = null;

  constructor(private readonly http: HttpClient, private readonly router: Router) {
    this.checkAuthentication();
  }

  checkAuthentication(): void {
    this.http.get<any>(this.checkAuthUrl, { withCredentials: true })
      .pipe(
        catchError((error) => {
          console.error('[AutenticacionService] Error al verificar autenticación', error);
          this.isAuthenticated.next(false);
          this.token = null;
          return of(false);
        })
      )
      .subscribe(response => {
        const isAuth = response && response.isAuthenticated === true;
        this.isAuthenticated.next(isAuth);
        if (response?.token) {
          this.token = response.token;
        }
      });
  }

  authenticateUsuario(usuario: string, contrasenna: string): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      { usuario, contrasenna },
      { 
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true
      }
    ).pipe(
      tap((response) => {
        if (response && response.mensage === "Authentication successful") {
          this.isAuthenticated.next(true);
          setTimeout(() => this.checkAuthentication(), 500);
          if (response?.token) {
            this.token = response.token;
          }
        }
      }),
      catchError((error) => {
        console.error('[AutenticacionService] Error en autenticación', error);
        return throwError(() => error);
      })
    );
  }

  isLoggedIn(): Observable<boolean> {
    this.checkAuthentication();
    return this.isAuthenticated.asObservable();
  }

  logout(): Observable<any> {
    return this.http.post<any>(this.logoutUrl, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.isAuthenticated.next(false);
          this.token = null;
          localStorage.removeItem('user_data');
          sessionStorage.removeItem('auth_provider');
        }),
        catchError((error) => {
          console.error('[AutenticacionService] Error al cerrar sesión localmente', error);
          // Limpiar estado local incluso si falla la petición al servidor
          this.isAuthenticated.next(false);
          this.token = null;
          document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; SameSite=Lax;';
          document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
          sessionStorage.removeItem('auth_provider');
          localStorage.removeItem('user_data');
          return of(null); // Retornar un observable válido aunque haya error
        })
      );
  }

  private clearEssentialCookies(): void {
    const essentialCookies = ['jwt_token', 'JSESSIONID']; 
    
    essentialCookies.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; SameSite=Lax;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
  }
  
  getUserInfo(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/v1/user-info`, { withCredentials: true }).pipe(
      catchError((error) => {
        console.error('[AutenticacionService] Error al obtener información del usuario', error);
        return throwError(() => error);
      })
    );
  }
  
  setToken(token: string): void {
    this.token = token;
    this.isAuthenticated.next(!!token);
  }
  
  getToken(): string | null {
    if (!this.token && this.isAuthenticated.getValue()) {
      this.http.get<any>(this.checkAuthUrl, { withCredentials: true })
        .pipe(
          catchError((error) => {
            console.error('[AutenticacionService] Error al obtener token', error);
            return of(null);
          })
        )
        .subscribe(response => {
          if (response?.token) {
            this.token = response.token;
          }
        });
    }
    return this.token;
  }
}
