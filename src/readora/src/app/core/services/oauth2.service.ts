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
      this.authService.checkAuthentication();

      try {
        // Guardar la intención de mostrar la notificación en window para que persista
        // entre navegaciones de Angular
        (window as any).showGoogleLoginSuccess = true;

        // Primero navegamos a la ruta principal
        this.router.navigate(['/']);

        // Crear un intervalo para intentar mostrar la notificación varias veces
        const intervalId = setInterval(() => {
          try {
            if ((window as any).showGoogleLoginSuccess) {
              // Mostrar la notificación
              this.notificationService.success('¡Autenticado!', {
                description: 'Has iniciado sesión correctamente con Google'
              });
              
              // Limpiar el flag y detener el intervalo
              (window as any).showGoogleLoginSuccess = false;
              clearInterval(intervalId);
            }
          } catch (e) {
            console.error('Error al mostrar notificación:', e);
          }
        }, 1000); // Intentar cada segundo hasta 5 veces
        
        // Detener después de 5 segundos como máximo
        setTimeout(() => {
          clearInterval(intervalId);
        }, 5000);
      } catch (e) {
        console.error('Error en handleOAuthSuccess:', e);
        // Como último recurso, mostrar una alerta básica
        setTimeout(() => alert('Has iniciado sesión correctamente con Google'), 1500);
      }
    }
  }

  /**
   * Llama a la comprobación de autenticación tras el registro
   */
  public checkAuthAfterRegister(): void {
    this.authService.checkAuthentication();
  }
}
