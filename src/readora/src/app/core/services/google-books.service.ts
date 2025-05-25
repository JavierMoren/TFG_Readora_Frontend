import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class GoogleBooksService {
  private apiUrl = `${environment.apiUrl}/books/google`;
  
  // Cache para almacenar libros ya vistos y evitar duplicados en la paginación
  private bookIdsCache: Map<string, Set<string>> = new Map();
  
  constructor(private http: HttpClient) { }

  /**
   * Busca libros en Google Books API con soporte para paginación
   * @param query Término de búsqueda
   * @param maxResults Número máximo de resultados por página (opcional)
   * @param startIndex Índice de inicio para la paginación (opcional)
   * @returns Observable con la respuesta de Google Books que incluye totalItems y los items de la página actual
   */
  searchBooks(query: string, maxResults: number = 10, startIndex: number = 0): Observable<any> {
    // Validar y sanear parámetros
    query = query?.trim() ?? '';
    if (!query) {
      console.warn('[GoogleBooksService] Query vacía');
      return new Observable(subscriber => {
        subscriber.next({
          items: [],
          content: [],
          totalItems: 0,
          totalElements: 0
        });
        subscriber.complete();
      });
    }
    
    // Normalizar la consulta para la caché
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');
    
    // Reiniciar la caché si estamos en la primera página
    if (startIndex === 0) {
      this.bookIdsCache.set(normalizedQuery, new Set<string>());
      console.log(`[GoogleBooksService] Iniciando nueva búsqueda para: "${query}"`);
    } else {
      console.log(`[GoogleBooksService] Continuando búsqueda para: "${query}", página: ${Math.floor(startIndex/maxResults) + 1}`);
    }
    
    maxResults = Math.min(Math.max(1, maxResults), 40); // Limitar entre 1 y 40
    startIndex = Math.max(0, startIndex); // No permitir índices negativos
    
    // Reducimos el límite máximo de resultados a 100 para mejorar el rendimiento
    const GOOGLE_MAX_RESULTS = 100;
    
    // Si estamos pidiendo resultados más allá del límite establecido, ajustar
    if (startIndex >= GOOGLE_MAX_RESULTS) {
      console.warn(`[GoogleBooksService] startIndex ${startIndex} excede el límite práctico de Google Books (${GOOGLE_MAX_RESULTS})`);
      startIndex = Math.max(0, GOOGLE_MAX_RESULTS - maxResults); // Último índice razonable
      console.log(`[GoogleBooksService] Ajustando a startIndex: ${startIndex}, equivalente a la página ${Math.floor(startIndex/maxResults) + 1}`);
    }
    
    const url = `${this.apiUrl}/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}`;
    
    console.log(`[GoogleBooksService] Ejecutando búsqueda: maxResults=${maxResults}, startIndex=${startIndex}`);
    
    return this.http.get<any>(url).pipe(
      map((response) => {
        // Asegurarnos de que response.items siempre sea un array
        response.items ??= [];
        
        // Normalizar la consulta para la caché
        const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');
        
        // Filtrar duplicados usando la caché
        const cachedIds = this.bookIdsCache.get(normalizedQuery) ?? new Set<string>();
        const originalCount = response.items.length;
        const filteredItems = this.filterDuplicates(response.items, cachedIds);
        
        // Actualizar la caché con los IDs que se están mostrando
        this.bookIdsCache.set(normalizedQuery, cachedIds);
        
        // Logging detallado
        const duplicatesCount = originalCount - filteredItems.length;
        if (duplicatesCount > 0) {
          console.log(`[GoogleBooksService] Filtrados ${duplicatesCount} libros duplicados (${filteredItems.length} únicos de ${originalCount})`);
        }
        
        response.items = filteredItems;
        
        // Limitar el número total de resultados reportados para evitar números irrealistas
        let totalElements = response.totalItems ?? 0;
        if (totalElements > GOOGLE_MAX_RESULTS) {
          console.log(`[GoogleBooksService] Limitando contador de resultados de ${totalElements} a ${GOOGLE_MAX_RESULTS} para mejor usabilidad`);
          totalElements = GOOGLE_MAX_RESULTS; // Limitar a un máximo más razonable
        }
        
        // Verificar caso especial: si recibimos menos resultados de los esperados pero hay más páginas disponibles
        const currentPage = Math.floor(startIndex / maxResults) + 1;
        const expectedTotalPages = Math.ceil(totalElements / maxResults);
        
        console.log(`[GoogleBooksService] Resultados: ${filteredItems.length} en página ${currentPage} de ${expectedTotalPages}`);
        
        return {
          ...response,
          // Asegurar compatibilidad con la interfaz de paginación del backend (content, totalElements)
          content: filteredItems,
          totalElements: totalElements,
          startIndex: startIndex, // Añadimos startIndex a la respuesta para comparación futura
          currentPage: currentPage - 1, // Para compatibilidad con la paginación (baseada en 0)
          totalPages: expectedTotalPages
        };
      }),
      catchError(error => {
        console.error('[GoogleBooksService] Error en la búsqueda:', error);
        return of({
          items: [],
          content: [],
          totalItems: 0,
          totalElements: 0
        });
      })
    );
  }
  
  /**
   * Filtra libros duplicados utilizando un conjunto de IDs ya vistos
   * @param items Array de libros a filtrar
   * @param cachedIds Conjunto de IDs ya vistos
   * @returns Array de libros sin duplicados
   */
  private filterDuplicates(items: any[], cachedIds: Set<string>): any[] {
    const filteredItems: any[] = [];
    const duplicates: string[] = [];
    const titleAuthorsMap: Map<string, boolean> = new Map(); // Para detectar duplicados por título+autor
    
    for (const item of items) {
      if (!item.id) {
        continue; // Saltamos entradas sin ID
      }
      
      // Verificar por ID
      if (cachedIds.has(item.id)) {
        duplicates.push(`ID:${item.id}`);
        continue;
      }
      
      // Además verificar por título+autor para atrapar duplicados con diferente ID
      const volumeInfo = item.volumeInfo ?? {};
      const title = (volumeInfo.title ?? '').toLowerCase().trim();
      const authors = (volumeInfo.authors ?? []).join('|').toLowerCase();
      const titleAuthorKey = `${title}###${authors}`;
      
      if (title && authors && titleAuthorsMap.has(titleAuthorKey)) {
        duplicates.push(`Contenido:${item.id} (${title})`);
        continue;
      }
      
      // Si llegamos aquí, no es un duplicado
      filteredItems.push(item);
      cachedIds.add(item.id);
      
      // Solo guardar en el mapa si tiene título y autores
      if (title && authors) {
        titleAuthorsMap.set(titleAuthorKey, true);
      }
    }
    
    // Información de depuración
    if (duplicates.length > 0) {
      console.log(`[GoogleBooksService] Se filtraron ${duplicates.length} libros duplicados`);
      if (duplicates.length < 10) {
        console.log(`[GoogleBooksService] Duplicados: ${duplicates.join(', ')}`);
      } else {
        console.log(`[GoogleBooksService] Primeros 10 duplicados: ${duplicates.slice(0, 10).join(', ')}...`);
      }
    }
    
    return filteredItems;
  }

  /**
   * Importa un libro desde Google Books a la base de datos local
   * @param googleBookId ID del libro en Google Books
   */
  importBook(googleBookId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/import/${googleBookId}`, {});
  }
}
