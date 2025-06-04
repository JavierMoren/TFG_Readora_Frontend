import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { Router } from '@angular/router';
import { AutenticacionService } from './autenticacion.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class OAuth2Service {
  readonly apiUrl = `${environment.apiUrl}/v1/oauth2`;

  constructor(
    private readonly http: HttpClient, 
    private readonly router: Router,
    public readonly authService: AutenticacionService,
    private readonly notificationService: NotificationService
  ) { }

  /**
   * Obtener la configuración OAuth2 desde el backend
   */
  getOAuth2Config(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/config`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener configuración OAuth2', error);
          return of({ error: true });
        })
      );
  }

  /**
   * Iniciar el flujo de autenticación OAuth2
   */
  loginWithGoogle(): void {
    this.getOAuth2Config().subscribe(config => {
      if (!config.error && config.loginUrl) {
        // Redirigimos al usuario al endpoint de autenticación OAuth2
        window.location.href = `${environment.apiBaseUrl}${config.loginUrl}`;
      }
    });
  }

  /**
   * Procesar el retorno de la autenticación OAuth2
   * Este método se llama desde la página de éxito después del OAuth
   */
  handleOAuthSuccess(token: string): void {
    if (token) {
      this.authService.setToken(token);
      // Forzar comprobación de autenticación tras login OAuth
      this.authService.checkAuthentication();
      
      // Guardar flag en localStorage para indicar login exitoso con Google
      localStorage.setItem('google_login_success', 'true');
      
      // Navegar a la página principal
      this.router.navigate(['/']);
    }
  }

  /**
   * Llama a la comprobación de autenticación tras el registro
   */
  public checkAuthAfterRegister(): void {
    this.authService.checkAuthentication();
  }
}
