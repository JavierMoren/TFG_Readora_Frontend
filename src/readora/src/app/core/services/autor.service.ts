import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Autor } from '../../models/autor/autor.model';
import { Libro } from '../../models/libro/libro.model';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class AutorService {
  private apiUrl = `${environment.apiUrl}/autores`;

  constructor(private http: HttpClient) { }

  getAllAutores(): Observable<Autor[]> {
    return this.http.get<Autor[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getAutorById(id: number): Observable<Autor> {
    return this.http.get<Autor>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createAutor(autor: Autor): Observable<Autor> {
    return this.http.post<Autor>(this.apiUrl, autor).pipe(
      catchError(this.handleError)
    );
  }

  updateAutor(autor: Autor): Observable<Autor> {
    return this.http.put<Autor>(`${this.apiUrl}/${autor.id}`, autor).pipe(
      catchError(this.handleError)
    );
  }

  deleteAutor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene autores de forma paginada
   * 
   * @param page Número de página (base 0)
   * @param size Tamaño de página
   * @param sort Campo para ordenar
   * @param direction Dirección del ordenamiento ('asc' o 'desc')
   * @returns Observable con los resultados paginados
   */
  getAllAutoresPaginados(page: number = 0, size: number = 10, sort: string = 'nombre', direction: string = 'asc'): Observable<any> {
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
  
  /**
   * Realiza una búsqueda avanzada de autores por nombre o biografía
   * 
   * @param query Texto a buscar en nombre o biografía
   * @param page Número de página (base 0)
   * @param size Tamaño de página
   * @param sort Campo para ordenar
   * @param direction Dirección del ordenamiento ('asc' o 'desc')
   * @returns Observable con los resultados paginados de la búsqueda
   */
  searchAutores(
    query: string, 
    page: number = 0, 
    size: number = 10, 
    sort: string = 'nombre', 
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
    
    return this.http.get(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Sube una imagen de foto para un autor
   * 
   * @param formData FormData que contiene el archivo a subir
   * @returns Observable con la respuesta del servidor, que incluye la URL de la imagen
   */
  uploadAutorImage(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/files/upload/autor`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Construye una URL completa para una ruta de imagen relativa
   * 
   * @param relativePath Ruta relativa de la imagen (ej: "autor/uuid-filename.jpg")
   * @returns URL completa para acceder a la imagen
   */
  getImageUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    return `${environment.apiUrl}/files/${relativePath}`;
  }

  /**
   * Obtiene el detalle completo de un autor por su ID, incluyendo sus libros
   * Usa el nuevo endpoint optimizado que evita referencias circulares
   * 
   * @param id ID del autor a consultar
   * @returns Observable con el detalle completo del autor incluyendo sus libros
   */
  getAutorDetalleById(id: number): Observable<Autor> {
    return this.http.get<Autor>(`${this.apiUrl}/${id}/detalle`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los libros de un autor específico
   * Este método es reutilizable y puede usarse en cualquier componente
   * 
   * @param id ID del autor
   * @returns Observable con la lista de libros del autor
   */
  getLibrosByAutorId(id: number): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${this.apiUrl}/${id}/libros`).pipe(
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