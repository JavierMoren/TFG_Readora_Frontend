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

  // ...existing code...

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

  // ...existing code...

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