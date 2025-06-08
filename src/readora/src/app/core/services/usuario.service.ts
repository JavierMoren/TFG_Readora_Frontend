import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Usuario } from '../../models/usuario/usuario.model';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) { }

  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getUsuariosPaginados(page: number = 0, size: number = 10, sort: string = 'id', direction: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
    
    return this.http.get<any>(`${this.apiUrl}/paginados`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario).pipe(
      catchError(this.handleError)
    );
  }
  
  updateUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${usuario.id}`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un usuario incluyendo la contraseña
   * Este método es específico para cuando se actualiza la contraseña de un usuario
   */
  updateUsuarioConPassword(usuario: Usuario): Observable<Usuario> {
    // Utilizamos la misma ruta de actualización estándar pero enviando explícitamente la contraseña
    return this.http.put<Usuario>(`${this.apiUrl}/${usuario.id}`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Verifica si la contraseña proporcionada coincide con la almacenada para el usuario
   */
  verificarContrasenna(credenciales: {usuario: string, contrasenna: string}): Observable<{valida: boolean}> {
    return this.http.post<{valida: boolean}>(`${this.apiUrl}/verificar-contrasenna`, credenciales).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un usuario por su nombre de usuario
   */
  getUsuarioByUsername(username: string): Observable<Usuario | null> {
    return this.http.get<Usuario | null>(`${this.apiUrl}/buscar-por-usuario/${username}`).pipe(
      catchError(err => {
        if (err.status === 404) return new Observable<Usuario | null>(observer => { observer.next(null); observer.complete(); });
        return this.handleError(err);
      })
    );
  }
  
  /**
   * Obtiene un usuario por su correo electrónico
   */
  getUsuarioByEmail(email: string): Observable<Usuario | null> {
    return this.http.get<Usuario | null>(`${this.apiUrl}/buscar-por-email/${email}`).pipe(
      catchError(err => {
        if (err.status === 404) return new Observable<Usuario | null>(observer => { observer.next(null); observer.complete(); });
        return this.handleError(err);
      })
    );
  }
  
  /**
   * Verifica si un nombre de usuario ya existe
   */
  checkUsuarioExiste(username: string): Observable<boolean> {
    // Si el nombre de usuario está vacío, consideramos que no existe
    if (!username || username.trim() === '') {
      return of(false);
    }
    
    const url = `${this.apiUrl}/buscar-por-usuario/${username}`;
    
    return this.http.get<any>(url).pipe(
      // Si la petición es exitosa, el usuario existe
      map(data => {
        return true;
      }),
      catchError(err => {
        if (err.status === 404) {
          // El usuario no existe
          return of(false);
        }
        // Para cualquier otro error, asumimos que existe para prevenir registros con errores
        return of(true);
      })
    );
  }
  
  /**
   * Verifica si un correo electrónico ya está registrado
   */
  checkEmailExiste(email: string): Observable<boolean> {
    // Si el email está vacío, consideramos que no existe
    if (!email || email.trim() === '') {
      return of(false);
    }
    
    const url = `${this.apiUrl}/buscar-por-email/${email}`;
    
    return this.http.get<any>(url).pipe(
      // Si la petición es exitosa, el email existe
      map(data => {
        return true;
      }),
      catchError(err => {
        if (err.status === 404) {
          // El email no existe
          return of(false);
        }
        // Para cualquier otro error, asumimos que existe para prevenir registros con errores
        return of(true);
      })
    );
  }

  /**
   * Crea un usuario desde el panel de admin (no cambia sesión ni JWT)
   */
  adminCreateUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/admin-create`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un usuario desde el panel de admin (no cambia sesión ni JWT)
   */
  adminUpdateUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/admin-update/${usuario.id}`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un usuario desde el panel de admin (no cambia sesión ni JWT)
   */
  adminDeleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin-delete/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
      if (error.error) {
        errorMessage += `\nDetalle: ${JSON.stringify(error.error)}`;
      }
    }
    return throwError(() => error);
  }
}