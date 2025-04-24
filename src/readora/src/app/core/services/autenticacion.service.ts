import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse , HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, throwError, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root',
})
export class AutenticacionService {
  
  private apiUrl = `${environment.apiUrl}/v1/authenticate`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly TOKEN_EXPIRY_KEY = 'auth_token_expiry';
  private token: BehaviorSubject<string | null>;

  constructor(private http: HttpClient, private router: Router) {
    // Inicializar el BehaviorSubject con el token almacenado
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    this.token = new BehaviorSubject<string | null>(storedToken);
    
    // Verificar la expiración del token al iniciar el servicio
    this.checkTokenExpiration();
  }

  private checkTokenExpiration(): void {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (expiryTime && new Date().getTime() > parseInt(expiryTime)) {
      this.removeTokenFromStorage();
      this.token.next(null);
      this.router.navigate(['/']);
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Método para autenticar al usuario.
   * @param username - Nombre de usuario ingresado.
   * @param password - Contraseña ingresada.
   * @returns Observable que emite un objeto con el token de autenticación si la solicitud es exitosa.
   */
  authenticateUsuario(usuario: string, contrasenna: string): Observable<{ token: string }> {
    return this.http.post<{ username: String, token: string }>(
      this.apiUrl,
      { usuario, contrasenna },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  /**
   * Almacena el token de autenticación en el localStorage y lo establece en el BehaviorSubject.
   * También establece un temporizador para cerrar la sesión automáticamente después de 2 horas.
   * @param token - Token recibido tras una autenticación exitosa.
   */
  setToken(token: string): void {
    // Establecer el token
    localStorage.setItem(this.TOKEN_KEY, token);
    
    // Calcular y guardar el tiempo de expiración (2 horas desde ahora)
    const expiryTime = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 horas en milisegundos
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    this.token.next(token);

    // Configurar el temporizador para la expiración automática
    setTimeout(() => {
      this.logout();
    }, 2 * 60 * 60 * 1000);
  }

  /**
   * Obtiene el token actual almacenado en el BehaviorSubject.
   * @returns El token actual o null si no está definido.
   */
  getToken(): string | null {
    return this.token.value;
  }

  /**
   * Devuelve un observable que emite el estado de autenticación basado en la existencia del token.
   * @returns Observable<boolean>
   */
  isLoggedIn(): Observable<boolean> {
    // Verifica si el token existe y emite un valor booleano.
    return this.token
      .asObservable()
      .pipe(map((token: string | null) => !!token));
  }

  /**
   * Método para cerrar la sesión del usuario.
   * Elimina el token y redirige al usuario a la página de inicio de sesión.
   */
  logout(): void {
    this.removeTokenFromStorage();
    this.token.next(null);
    this.router.navigate(['/']);
  }

  /**
   * Método privado para eliminar el token del almacenamiento
   * Separa esta funcionalidad para evitar referencias circulares
   */
  private removeTokenFromStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
}
