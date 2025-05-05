import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
   * @param usuario Datos del usuario con la nueva contraseña
   * @returns Observable con el usuario actualizado
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
   * @param credenciales Objeto con el nombre de usuario y contraseña a verificar
   * @returns Observable que emite el resultado de la verificación
   */
  verificarContrasenna(credenciales: {usuario: string, contrasenna: string}): Observable<{valida: boolean}> {
    return this.http.post<{valida: boolean}>(`${this.apiUrl}/verificar-contrasenna`, credenciales).pipe(
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
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}