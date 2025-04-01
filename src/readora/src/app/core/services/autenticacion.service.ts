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

  // BehaviorSubject almacena el token y permite a otros componentes reaccionar cuando cambia.
  private token = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

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
   * Almacena el token de autenticación en el BehaviorSubject.
   * @param token - Token recibido tras una autenticación exitosa.
   */
  setToken(token: string): void {
    this.token.next(token); // Actualiza el valor del token.
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
    this.token.next(null); // Limpia el token almacenado.
    this.router.navigate(['/']); // Redirige al usuario a la ruta raíz.
  }
}
