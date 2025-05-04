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

  /**
   * Sube un archivo al servidor
   * @param file FormData con el archivo a subir
   * @param tipo Tipo de archivo ('autor' o 'libro')
   * @returns Observable con la respuesta del servidor
   */
  uploadFile(file: FormData, tipo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload/${tipo}`, file);
  }

  /**
   * Construye la URL completa para un recurso de imagen
   * @param path Ruta relativa de la imagen
   * @returns URL completa para acceder a la imagen
   */
  getFullImageUrl(path: string | null): string {
    if (!path) {
      return this.getDefaultImageUrl(path);
    }
    
    // Si la ruta ya es una URL completa, devolverla tal cual
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Si es una ruta relativa, construir la URL completa
    return `${environment.apiUrl}/files/${path}`;
  }
  
  /**
   * Devuelve una URL de imagen por defecto según el tipo
   * @param path Ruta original (si contiene "autor" o "libro")
   * @returns URL de la imagen por defecto
   */
  getDefaultImageUrl(path: string | null): string {
    if (path && path.includes('autor')) {
      return 'assets/images/default-author.jpg';
    }
    return 'assets/images/default-book-cover.jpg';
  }

  /**
   * Elimina un archivo del servidor
   * @param path Ruta relativa del archivo a eliminar
   * @returns Observable con la respuesta del servidor
   */
  deleteFile(path: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${path}`);
  }
}