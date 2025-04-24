import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { Libro } from '../../models/libro/libro.model';

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private apiUrl = `${environment.apiUrl}/libros`;

  constructor(private http: HttpClient) { }

  getAllLibros(): Observable<Libro[]> {
    return this.http.get<Libro[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

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
