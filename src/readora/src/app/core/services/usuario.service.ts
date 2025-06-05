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
    console.log(`[UsuarioService] Verificando si existe el usuario: "${username}"`);
    
    // Si el nombre de usuario está vacío, consideramos que no existe
    if (!username || username.trim() === '') {
      console.log('[UsuarioService] Nombre de usuario vacío, considerando como no existente');
      return of(false);
    }
    
    const url = `${this.apiUrl}/buscar-por-usuario/${username}`;
    console.log(`[UsuarioService] URL de petición: ${url}`);
    
    return this.http.get<any>(url).pipe(
      // Si la petición es exitosa, el usuario existe
      map(data => {
        console.log(`[UsuarioService] Respuesta exitosa para usuario "${username}":`);
        console.log(data);
        console.log(`[UsuarioService] Usuario "${username}" encontrado, existe=true`);
        console.log(`[UsuarioService] DEVOLVIENDO true`);
        return true;
      }),
      catchError(err => {
        console.log(`[UsuarioService] Error al verificar usuario "${username}":`, err);
        console.log(`[UsuarioService] Tipo de error:`, typeof err);
        console.log(`[UsuarioService] Estado HTTP:`, err.status);
        console.log(`[UsuarioService] Mensaje de error:`, err.message);
        
        if (err.status === 404) {
          // El usuario no existe
          console.log(`[UsuarioService] Usuario "${username}" no encontrado (404), existe=false`);
          console.log(`[UsuarioService] DEVOLVIENDO false`);
          return of(false);
        }
        // Para cualquier otro error, asumimos que existe para prevenir registros con errores
        console.log(`[UsuarioService] Error diferente a 404, considerando usuario "${username}" como existente`);
        console.log(`[UsuarioService] DEVOLVIENDO true`);
        return of(true);
      })
    );
  }
  
  /**
   * Verifica si un correo electrónico ya está registrado
   */
  checkEmailExiste(email: string): Observable<boolean> {
    console.log(`[UsuarioService] Verificando si existe el email: "${email}"`);
    
    // Si el email está vacío, consideramos que no existe
    if (!email || email.trim() === '') {
      console.log('[UsuarioService] Email vacío, considerando como no existente');
      return of(false);
    }
    
    const url = `${this.apiUrl}/buscar-por-email/${email}`;
    console.log(`[UsuarioService] URL de petición email: ${url}`);
    
    return this.http.get<any>(url).pipe(
      // Si la petición es exitosa, el email existe
      map(data => {
        console.log(`[UsuarioService] Respuesta exitosa para email "${email}":`);
        console.log(data);
        console.log(`[UsuarioService] Email "${email}" encontrado, existe=true`);
        console.log(`[UsuarioService] DEVOLVIENDO true`);
        return true;
      }),
      catchError(err => {
        console.log(`[UsuarioService] Error al verificar email "${email}":`, err);
        console.log(`[UsuarioService] Tipo de error:`, typeof err);
        console.log(`[UsuarioService] Estado HTTP:`, err.status);
        console.log(`[UsuarioService] Mensaje de error:`, err.message);
        
        if (err.status === 404) {
          // El email no existe
          console.log(`[UsuarioService] Email "${email}" no encontrado (404), existe=false`);
          console.log(`[UsuarioService] DEVOLVIENDO false`);
          return of(false);
        }
        // Para cualquier otro error, asumimos que existe para prevenir registros con errores
        console.log(`[UsuarioService] Error diferente a 404, considerando email "${email}" como existente`);
        console.log(`[UsuarioService] DEVOLVIENDO true`);
        return of(true);
      })
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