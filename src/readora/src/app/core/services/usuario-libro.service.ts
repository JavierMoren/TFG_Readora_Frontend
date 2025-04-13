import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { UsuarioLibro } from '../../models/usuario-libro/usuario-libro.model';
import { environment } from '../../../enviroments/enviroments';
import { AutenticacionService } from './autenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioLibroService {
  private apiUrl = `${environment.apiUrl}/usuario-libros`;

  constructor(private http: HttpClient, private autenticationService: AutenticacionService) { }

  getAllUsuarioLibros(): Observable<UsuarioLibro[]> {
    const token = this.autenticationService.getToken();

    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    return this.http.get<UsuarioLibro[]>(this.apiUrl, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
} 