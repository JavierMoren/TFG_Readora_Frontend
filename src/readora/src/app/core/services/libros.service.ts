import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
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
  
  createLibro(libro: any): Observable<Libro> {
    // Verificar si el libro tiene autoresIds
    if (libro.autoresIds) {

    } else {
      libro.autoresIds = [];
    }
    
    // Asegurar que el Content-Type sea application/json para que se procesen correctamente los arrays
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    return this.http.post<Libro>(this.apiUrl, libro, httpOptions).pipe(
      catchError(this.handleError)
    );
  }
  
  updateLibro(libro: any): Observable<Libro> {
    // Verificar si el libro tiene autoresIds
    if (libro.autoresIds) {
    } else {
      libro.autoresIds = [];
    }
    
    // Asegurar que el Content-Type sea application/json para que se procesen correctamente los arrays
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    return this.http.put<Libro>(`${this.apiUrl}/${libro.id}`, libro, httpOptions).pipe(
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
   * Construye una URL completa para una ruta de imagen relativa o devuelve una imagen predeterminada
   * @param path Ruta relativa de la imagen
   * @returns URL completa de la imagen o ruta a la imagen predeterminada
   */
  getImageUrl(path: string | null): string {
    if (!path) {
      return 'assets/placeholders/book-placeholder.svg'; // Imagen predeterminada para libros
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    return `${environment.apiUrl}/files/${path}`;
  }

  /**
   * Desasocia todos los autores de un libro específico
   * Esto es útil cuando queremos eliminar todas las relaciones libro-autor
   * @param libroId - ID del libro
   * @returns Observable que emite cuando la operación se completa
   */
  removeAllAutoresFromLibro(libroId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${libroId}/autores`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Asigna autores específicos a un libro
   * Esta operación reemplaza cualquier asociación existente
   * @param libroId - ID del libro
   * @param autoresIds - Array con los IDs de los autores a asignar
   * @returns Observable que emite cuando la operación se completa
   */
  assignAutoresToLibro(libroId: number, autoresIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${libroId}/autores`, { autoresIds }).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Actualiza un libro y sus relaciones con autores en una sola operación
   * Este método se encarga de:
   * 1. Eliminar las relaciones existentes con autores
   * 2. Actualizar la información del libro
   * 3. Asignar los nuevos autores
   * @param libro - Datos del libro a actualizar (debe incluir id y autoresIds)
   * @returns Observable que emite el libro actualizado
   */
  updateLibroConAutores(libro: any): Observable<any> {
    // Primero nos aseguramos de que el libro tenga un ID válido
    if (!libro.id) {
      return throwError(() => new Error('El libro debe tener un ID para ser actualizado'));
    }
    
    
    // Hacemos una copia para no modificar el objeto original
    const libroCopy = { ...libro };
    
    // Extraemos los IDs de autores
    const autoresIds = Array.isArray(libroCopy.autoresIds) ? libroCopy.autoresIds : [];
    
    // 1. Primero eliminamos todas las relaciones existentes
    return this.removeAllAutoresFromLibro(libroCopy.id).pipe(
      switchMap(() => {
        // 2. Luego actualizamos la información del libro
        return this.updateLibro(libroCopy);
      }),
      switchMap((updatedLibro) => {
        // 3. Finalmente asignamos los nuevos autores
        if (autoresIds.length > 0) {
          return this.assignAutoresToLibro(updatedLibro.id, autoresIds).pipe(
            map(() => updatedLibro)
          );
        } else {
          // Si no hay autores, simplemente devolvemos el libro actualizado
          return of(updatedLibro);
        }
      }),
      catchError((error) => {
        console.error('[LibrosService] Error al actualizar libro con autores:', error);
        return throwError(() => error);
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
    console.error('[LibrosService] Error HTTP:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}