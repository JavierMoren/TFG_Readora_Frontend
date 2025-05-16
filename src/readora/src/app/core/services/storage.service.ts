import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) { }

  uploadFile(file: FormData, tipo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload/${tipo}`, file);
  }
  
  uploadLibroImage(file: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'libro.jpg');
    return this.uploadFile(formData, 'libro');
  }
  
  uploadAutorImage(file: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'autor.jpg');
    return this.uploadFile(formData, 'autor');
  }
  
  uploadLibroPortada(file: File): Observable<any> {
    return this.uploadLibroImage(file);
  }
  
  uploadAutorFoto(file: File): Observable<any> {
    return this.uploadAutorImage(file);
  }

  getFullImageUrl(path: string | null): string {
    if (!path) {
      return this.getDefaultImageUrl(path);
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${environment.apiUrl}/files/${path}`;
  }
  
  getDefaultImageUrl(path: string | null): string {
    if (path && path.includes('autor')) {
      return 'assets/images/default-author.jpg';
    }
    return 'assets/images/default-book-cover.jpg';
  }

  /**
   * Elimina un archivo del servidor
   */
  deleteFile(path: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${path}`);
  }

  /**
   * Sube una imagen al servidor
   * @param file - Archivo de imagen a subir
   * @param tipo - Tipo de imagen (libro, autor, etc.)
   * @returns Observable con la URL de la imagen subida
   */
  uploadImage(file: File, tipo: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.uploadFile(formData, tipo);
  }
}