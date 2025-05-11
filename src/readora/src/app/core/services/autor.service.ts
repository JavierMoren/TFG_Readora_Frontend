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
  
  searchAutores(
    query: string, 
    page: number = 0, 
    size: number = 10, 
    sort: string = 'nombre', 
    direction: string = 'asc'
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
      
    if (query && query.trim() !== '') {
      params = params.set('query', query.trim());
    }
    
    return this.http.get(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  uploadAutorImage(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/files/upload/autor`, formData).pipe(
      catchError(this.handleError)
    );
  }

  getImageUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    return `${environment.apiUrl}/files/${relativePath}`;
  }

  getAutorDetalleById(id: number): Observable<Autor> {
    return this.http.get<Autor>(`${this.apiUrl}/${id}/detalle`).pipe(
      catchError(this.handleError)
    );
  }

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
    console.error('[AutorService] Error HTTP:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}