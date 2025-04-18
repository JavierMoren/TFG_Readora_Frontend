import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Usuario } from '../../models/usuario/usuario.model';
import { environment } from '../../../enviroments/enviroments';
import { AutenticacionService } from './autenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient, private autenticationService: AutenticacionService) { }

  getAllUsuarios(): Observable<Usuario[]> {
    const token = this.autenticationService.getToken();

    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    return this.http.get<Usuario[]>(this.apiUrl, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    const token = this.autenticationService.getToken();

    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    return this.http.post<Usuario>(this.apiUrl, usuario, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
  
  updateUsuario(usuario: Usuario): Observable<Usuario> {
    const token = this.autenticationService.getToken();

    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    return this.http.put<Usuario>(`${this.apiUrl}/${usuario.id}`, usuario, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  deleteUsuario(id: number): Observable<void> {
    const token = this.autenticationService.getToken();

    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
} 