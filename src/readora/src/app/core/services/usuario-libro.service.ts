import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsuarioLibro } from '../../models/usuario-libro/usuario-libro.model';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class UsuarioLibroService {
  private apiUrl = `${environment.apiUrl}/usuario-libros`;

  constructor(private http: HttpClient) { }

  getAllUsuarioLibros(): Observable<UsuarioLibro[]> {
    return this.http.get<UsuarioLibro[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getUsuarioLibrosPaginados(page: number = 0, size: number = 10, sort: string = 'id', direction: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
    
    return this.http.get<any>(`${this.apiUrl}/paginados`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getUsuarioLibroById(id: number): Observable<UsuarioLibro> {
    return this.http.get<UsuarioLibro>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createUsuarioLibro(usuarioLibro: UsuarioLibro): Observable<UsuarioLibro> {
    return this.http.post<UsuarioLibro>(this.apiUrl, usuarioLibro).pipe(
      catchError(this.handleError)
    );
  }

  updateUsuarioLibro(id: number, usuarioLibro: UsuarioLibro): Observable<UsuarioLibro> {
    return this.http.put<UsuarioLibro>(`${this.apiUrl}/${id}`, usuarioLibro).pipe(
      catchError(this.handleError)
    );
  }

  deleteUsuarioLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene todas las relaciones usuario-libro para un usuario específico
   * @param usuarioId ID del usuario
   * @returns Observable con la lista de relaciones usuario-libro
   */
  getLibrosByUsuarioId(usuarioId: number): Observable<UsuarioLibro[]> {
    return this.http.get<UsuarioLibro[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene las relaciones usuario-libro paginadas con información detallada (nombres de usuario y libro)
   * @param page Número de página (base 0)
   * @param size Tamaño de página
   * @param sort Campo para ordenar
   * @param direction Dirección del ordenamiento ('asc' o 'desc')
   * @returns Observable con los resultados paginados con detalles ampliados
   */
  getUsuarioLibrosDetalladosPaginados(page: number = 0, size: number = 10, sort: string = 'id', direction: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
    
    return this.http.get<any>(`${this.apiUrl}/detallados/paginados`, { params }).pipe(
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