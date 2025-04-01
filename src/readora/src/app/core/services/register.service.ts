import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private apiUrl = `${environment.apiUrl}/v1/register`;

  constructor(private http: HttpClient) {}

  registerUsuario(data: any): Observable<HttpResponse<any>> {
    return this.http.post(this.apiUrl, data, { observe: 'response' });
  }
}