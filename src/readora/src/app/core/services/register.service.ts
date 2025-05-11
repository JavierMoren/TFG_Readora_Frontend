import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private apiUrl = `${environment.apiUrl}/v1/register`;

  constructor(private http: HttpClient) {}

  registerUsuario(data: any): Observable<HttpResponse<any>> {
    return this.http.post(this.apiUrl, data, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('[RegisterService] Error de HTTP:', error);
    return throwError(() => error);
  }
}