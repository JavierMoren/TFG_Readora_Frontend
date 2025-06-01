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

  getLibrosByUsuarioId(usuarioId: number): Observable<UsuarioLibro[]> {
    return this.http.get<UsuarioLibro[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      catchError(this.handleError)
    );
  }

  getUsuariosByLibroId(libroId: number): Observable<UsuarioLibro[]> {
    return this.http.get<UsuarioLibro[]>(`${this.apiUrl}/libro/${libroId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Busca libros en la biblioteca personal de un usuario filtrados por estado de lectura y título
   * @param usuarioId ID del usuario
   * @param estado Estado de lectura (LEYENDO, TERMINADO, PENDIENTE, ABANDONADO)
   * @param query Título o parte del título del libro a buscar
   * @returns Observable con la lista de libros que coinciden con los criterios
   */
  buscarLibrosPorEstadoYTitulo(usuarioId: number, estado: string, query: string): Observable<UsuarioLibro[]> {
    let params = new HttpParams()
      .set('estado', estado)
      .set('query', query);
    
    return this.http.get<UsuarioLibro[]>(`${this.apiUrl}/usuario/${usuarioId}/buscar`, { params }).pipe(
      catchError(this.handleError)
    );
  }

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
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
      if (error.error) {
        errorMessage += `\nDetalle: ${JSON.stringify(error.error)}`;
      }
    }
    console.error('[UsuarioLibroService] Error HTTP:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}