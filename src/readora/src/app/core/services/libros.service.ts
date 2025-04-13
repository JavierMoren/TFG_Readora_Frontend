import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
import { Libro } from '../../models/libro/libro.module';
import { AutenticacionService } from './autenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class LibrosService {
  private apiUrl = `${environment.apiUrl}/libros`;

  constructor(private http: HttpClient, private autenticationService: AutenticacionService) { }

  getAllLibros(): Observable<Libro[]> {
    const token = this.autenticationService.getToken(); 

    if (!token) {
      return throwError(() => new Error('Unauthorized')); 
    }

    return this.http.get<Libro[]>(this.apiUrl, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) 
    });
  }

  getAllLibrosPaginados(page: number = 0, size: number = 10, sort: string = 'id', direction: string = 'asc'): Observable<any> {
    const token = this.autenticationService.getToken();
    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);

    return this.http.get(`${this.apiUrl}/paginados`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      params: params
    });
  }
}
