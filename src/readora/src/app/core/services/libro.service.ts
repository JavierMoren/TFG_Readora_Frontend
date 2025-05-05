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
export class LibroService {
  private apiUrl = `${environment.apiUrl}/libros`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene un libro por su ID
   * @param id ID del libro a obtener
   * @returns Observable con el libro
   */
  getLibroById(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los autores de un libro específico
   * Este método es reutilizable y puede usarse en cualquier componente
   * 
   * @param id ID del libro
   * @returns Observable con la lista de autores del libro
   */
  getAutoresByLibroId(id: number): Observable<Autor[]> {
    return this.http.get<Autor[]>(`${this.apiUrl}/${id}/autores`).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Obtiene libros paginados con opciones de filtrado y ordenamiento
   * @param page Número de página (base 0)
   * @param size Tamaño de página
   * @param sortBy Campo por el que ordenar
   * @param sortDir Dirección de ordenamiento (asc/desc)
   * @param query Término de búsqueda opcional
   * @returns Observable con la página de libros
   */
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
   * Crea un nuevo libro
   * @param libro Datos del libro a crear
   * @returns Observable con el libro creado
   */
  createLibro(libro: any): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Actualiza un libro existente
   * @param libro Datos del libro a actualizar
   * @returns Observable con el libro actualizado
   */
  updateLibro(libro: any): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${libro.id}`, libro).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Elimina un libro por su ID
   * @param id ID del libro a eliminar
   * @returns Observable con la respuesta
   */
  deleteLibro(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Obtiene la URL completa de una imagen de portada de libro
   * @param path Ruta relativa de la imagen
   * @returns URL completa
   */
  getImageUrl(path: string | null): string {
    if (!path) {
      return '/assets/placeholder-book.jpg';
    }
    
    // Si la ruta ya es una URL completa, devolverla tal cual
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Si es una ruta relativa, construir la URL completa
    return `${environment.apiUrl}/files/${path}`;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something bad happened; please try again later.');
  }
}