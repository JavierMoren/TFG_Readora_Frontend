import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Role } from '../../models/role/role.model';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) { }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getRolesPaginados(page: number = 0, size: number = 10, sort: string = 'id', direction: string = 'asc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);
    
    return this.http.get<any>(`${this.apiUrl}/paginados`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role).pipe(
      catchError(this.handleError)
    );
  }

  updateRole(role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${role.id}`, role).pipe(
      catchError(this.handleError)
    );
  }

  deleteRole(id: number): Observable<void> {
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