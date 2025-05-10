import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Libro } from '../../models/libro/libro.model';
import { Autor } from '../../models/autor/autor.model';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private apiUrl = `${environment.apiUrl}/libros`;

  constructor(private http: HttpClient) { }

  // Obtiene todos los libros sin paginación
  getAllLibros(): Observable<Libro[]> {
    return this.http.get<Libro[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }
  
  // Obtiene todos los libros con paginación
  getAllLibrosPaginados(page: number = 0, size: number = 10, sort: string = 'id', direction: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);

    return this.http.get(`${this.apiUrl}/paginados`, {
      params: params
    }).pipe(
      catchError(this.handleError)
    );
  }

  getLibroById(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Obtiene el detalle completo de un libro, incluyendo la lista de autores asociados
   */
  getLibroDetalleById(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${id}/detalle`).pipe(
      catchError(this.handleError)
    );
  }

  getAutoresByLibroId(id: number): Observable<Autor[]> {
    return this.http.get<Autor[]>(`${this.apiUrl}/${id}/autores`).pipe(
      catchError(this.handleError)
    );
  }
  
  getLibrosPaginados(page: number, size: number, sortBy: string, sortDir: string, query?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    
    if (query) {
      params = params.set('query', query);
    }
    
    return this.http.get<any>(`${this.apiUrl}/paginados`, { params }).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Realiza una búsqueda avanzada de libros según múltiples criterios
   */
  searchLibros(
    query: string, 
    filters: any = {}, 
    page: number = 0, 
    size: number = 10, 
    sort: string = 'titulo', 
    direction: string = 'asc'
  ): Observable<any> {
    
    // Construir parámetros de búsqueda
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
      
    // Añadir query si existe
    if (query && query.trim() !== '') {
      params = params.set('query', query.trim());
    }
    
    // Añadir filtros opcionales
    if (filters.genero) {
      params = params.set('genero', filters.genero);
    }
    
    if (filters.yearFrom) {
      params = params.set('yearFrom', filters.yearFrom.toString());
    }
    
    if (filters.yearTo) {
      params = params.set('yearTo', filters.yearTo.toString());
    }
    
    return this.http.get(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }
  
  createLibro(libro: Libro): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro).pipe(
      catchError(this.handleError)
    );
  }
  
  updateLibro(libro: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${libro.id}`, libro).pipe(
      catchError(this.handleError)
    );
  }
  
  deleteLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Sube una imagen de portada para un libro
   */
  uploadPortadaImage(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/files/upload/libro`, formData).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Construye una URL completa para una ruta de imagen relativa
   */
  getImageUrl(path: string | null): string {
    if (!path) {
      return '/assets/placeholder-book.jpg';
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    return `${environment.apiUrl}/files/${path}`;
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