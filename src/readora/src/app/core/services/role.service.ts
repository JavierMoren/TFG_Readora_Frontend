import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Role } from '../../models/role/role.model';
import { environment } from '../../../enviroments/enviroments';
import { AutenticacionService } from './autenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient, private autenticationService: AutenticacionService) { }

  getAllRoles(): Observable<Role[]> {
    const token = this.autenticationService.getToken();

    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    return this.http.get<Role[]>(this.apiUrl, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

} 