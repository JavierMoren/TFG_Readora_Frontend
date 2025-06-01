import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LibrosService } from '../../core/services/libros.service';
import { AutorService } from '../../core/services/autor.service';
import { GoogleBooksService } from '../../core/services/google-books.service';
import { NotificationService } from '../../core/services/notification.service';
import { ResultadoBusquedaComponent, PageChangeEvent } from './resultado-busqueda/resultado-busqueda.component';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css'],
  
  imports: [CommonModule, ReactiveFormsModule, ResultadoBusquedaComponent]
})
export class BuscadorComponent implements OnInit {
  searchForm: FormGroup;
  isSearchingBooks: boolean = true;
  results: any[] = [];
  totalItems: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  loading: boolean = false;
  lastSearchTerm: string = '';
  lastSearchType: string = 'libros';
  
  // Propiedades para Google Books
  isGoogleSearch: boolean = false;
  googleBooksStartIndex: number = 0;
  googleBooksMaxResults: number = 10;
  googleBooksTotalItems: number = 0;
  
  // Propiedades para estado y errores
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Exponemos Math para usar en el template
  Math = Math;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly librosService: LibrosService,
    private readonly autorService: AutorService,
    private readonly googleBooksService: GoogleBooksService,
    private readonly notificationService: NotificationService
  ) { 
    this.searchForm = this.formBuilder.group({
      searchTerm: [''],
      searchType: ['libros'] // 'libros' o 'autores'
    });
  }

  /**
   * Verifica si el término de búsqueda es válido (al menos 3 caracteres)
   */
  get isValidSearch(): boolean {
    const searchTerm = this.searchForm.get('searchTerm')?.value?.trim();
    return searchTerm && searchTerm.length >= 3;
  }

  /**
   * Verifica si el término de búsqueda es válido para Google Books (al menos 3 caracteres)
   * @deprecated Use isValidSearch instead
   */
  get isValidForGoogleSearch(): boolean {
    return this.isValidSearch;
  }

  ngOnInit(): void {
    this.searchForm.get('searchType')?.valueChanges.subscribe(value => {
      this.isSearchingBooks = value === 'libros';
      // Reiniciar la bandera de Google al cambiar tipo de búsqueda
      this.isGoogleSearch = false;
      this.results = [];
      this.totalItems = 0;
      this.currentPage = 0;
      this.hasError = false;
      this.errorMessage = '';
    });
  }

  // Método para realizar búsqueda profunda (Google Books)
  searchDeep(): void {
    const searchTerm = this.searchForm.get('searchTerm')?.value?.trim();
    
    // Validar que el término de búsqueda tenga al menos 3 caracteres
    if (!this.isValidSearch) {
      this.hasError = true;
      this.errorMessage = 'El término de búsqueda debe tener al menos 3 caracteres para buscar en Google Books.';
      return;
    }
    
    this.isGoogleSearch = true;
    // Reiniciar la paginación para la búsqueda en Google Books
    this.currentPage = 0;
    this.googleBooksStartIndex = 0;
    this.hasError = false;
    this.errorMessage = '';
    this.lastSearchTerm = searchTerm;
    
    console.log(`[Buscador] Iniciando búsqueda profunda en Google Books: "${searchTerm}"`);
    this.searchGoogleBooks(searchTerm);
  }
  
  search(): void {
    if (!this.searchForm.valid) return;

    const searchTerm = this.searchForm.get('searchTerm')?.value?.trim();
    const searchType = this.searchForm.get('searchType')?.value;
    
    // Validar que el término de búsqueda tenga al menos 3 caracteres
    if (!searchTerm || searchTerm.length < 3) {
      this.hasError = true;
      this.errorMessage = 'El término de búsqueda debe tener al menos 3 caracteres.';
      return;
    }
    
    // Resetear la bandera de búsqueda en Google
    this.isGoogleSearch = false;
    
    // Resetear el estado de error
    this.hasError = false;
    this.errorMessage = '';
    
    this.lastSearchTerm = searchTerm;
    this.lastSearchType = searchType;
    
    if (searchTerm !== this.lastSearchTerm || searchType !== this.lastSearchType) {
      this.currentPage = 0;
      this.googleBooksStartIndex = 0;
    }
    
    this.loading = true;

    if (searchType === 'libros') {
      // Siempre buscar primero en la biblioteca local
      this.searchBooks(searchTerm);
    } else {
      this.searchAuthors(searchTerm);
    }
  }

  searchBooks(term: string): void {
    this.librosService.searchLibros(term, {}, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.results = data.content;
          this.totalItems = data.totalElements;
          this.loading = false;
          
          // Si no hay resultados locales, sugerir búsqueda en Google Books
          if (this.results.length === 0 && !this.isGoogleSearch) {
            console.log('[Buscador] No se encontraron resultados locales para:', term);
          }
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar libros', error);
          this.loading = false;
          this.results = [];
          this.hasError = true;
          this.errorMessage = 'Error al buscar en la biblioteca local. Por favor, inténtalo de nuevo.';
          this.notificationService.error('Error de búsqueda', {
            description: 'No se pudo buscar en la biblioteca local'
          });
        }
      });
  }

  searchAuthors(term: string): void {
    this.autorService.searchAutores(term, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.results = data.content;
          this.totalItems = data.totalElements;
          this.loading = false;
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar autores', error);
          this.loading = false;
          this.results = [];
          this.hasError = true;
          this.errorMessage = 'Error al buscar autores. Por favor, inténtalo de nuevo.';
          this.notificationService.error('Error de búsqueda', {
            description: 'No se pudo buscar autores'
          });
        }
      });
  }
  
  // Método para buscar en Google Books
  searchGoogleBooks(term: string): void {
    if (!term) return;
    
    this.loading = true;
    this.hasError = false; // Reiniciar estado de error
    
    // Asegurarnos de que el startIndex esté correctamente calculado
    // Es importante recalcular esto antes de cada búsqueda para mantener la consistencia en la paginación
    this.googleBooksStartIndex = this.currentPage * this.googleBooksMaxResults;
    
    // Reducimos el límite máximo de resultados a 100 para mejorar el rendimiento
    const GOOGLE_MAX_RESULTS = 100; // Nuevo límite más razonable
    
    // Verificar si estamos intentando acceder a una página más allá del límite práctico
    if (this.googleBooksStartIndex >= GOOGLE_MAX_RESULTS) {
      console.warn(`[Buscador] StartIndex ${this.googleBooksStartIndex} excede el límite establecido de Google Books (${GOOGLE_MAX_RESULTS})`);
      // Ajustar a la última página posible
      const lastValidPage = Math.floor((GOOGLE_MAX_RESULTS - 1) / this.googleBooksMaxResults);
      this.currentPage = lastValidPage;
      this.googleBooksStartIndex = this.currentPage * this.googleBooksMaxResults;
      console.log(`[Buscador] Ajustado a la última página válida: ${this.currentPage+1}, startIndex=${this.googleBooksStartIndex}`);
    }
    
    // Logging detallado para depuración
    console.log(`[Buscador] Buscando en Google Books: "${term}"`);
    console.log(`[Buscador] Parámetros de paginación - Página: ${this.currentPage + 1}, maxResults: ${this.googleBooksMaxResults}, startIndex: ${this.googleBooksStartIndex}`);
    
    this.googleBooksService.searchBooks(term, this.googleBooksMaxResults, this.googleBooksStartIndex)
      .subscribe({
        next: (data) => {
          // Verificar si recibimos datos válidos y guardar el startIndex con el que se realizó la búsqueda
          const receivedStartIndex = data.startIndex !== undefined ? data.startIndex : this.googleBooksStartIndex;
          
          // Verificar si recibimos algún resultado
          if (data?.items?.length > 0) {
            // Transformar los resultados de Google Books al formato esperado por el componente
            this.results = this.transformGoogleBooksResults(data.items);
            
            // Usar el total de elementos limitado que viene del servicio
            this.googleBooksTotalItems = data.totalElements ?? 0;
            this.totalItems = this.googleBooksTotalItems;
            
            // Verificar que no estamos en una página que excede el total
            const maxPage = Math.ceil(this.totalItems / this.pageSize) - 1;
            if (this.currentPage > maxPage && maxPage >= 0) {
              this.currentPage = maxPage;
              this.googleBooksStartIndex = this.currentPage * this.googleBooksMaxResults;
              console.log(`[Buscador] Ajustando a página máxima: ${this.currentPage+1}`);
              
              // Si hubo un cambio de página y el startIndex es diferente, ejecutar una nueva búsqueda
              if (this.googleBooksStartIndex !== receivedStartIndex) {
                console.log(`[Buscador] Recargando con nuevo startIndex: ${this.googleBooksStartIndex}`);
                this.loading = false;
                this.searchGoogleBooks(term);
                return;
              }
            }
            
            // Logging detallado para depuración
            console.log(`[Buscador] Recibidos ${this.results.length} resultados de un total estimado de ${this.totalItems}`);
            console.log(`[Buscador] Página actual: ${this.currentPage + 1} de ${Math.ceil(this.totalItems / this.pageSize)}`);
          } else {
            this.results = [];
            this.totalItems = 0;
            console.log('[Buscador] No se encontraron resultados en Google Books');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar en Google Books', error);
          this.loading = false;
          this.results = [];
          this.totalItems = 0;
          this.hasError = true;
          this.errorMessage = 'Error al comunicarse con Google Books. Por favor, inténtalo de nuevo.';
        }
      });
  }
  
  // Transforma los resultados de Google Books al formato esperado por el componente
  transformGoogleBooksResults(items: any[]): any[] {
    if (!items || !Array.isArray(items)) {
      console.warn('[Buscador] Items de Google Books no es un array válido');
      return [];
    }
    
    return items.map(item => {
      if (!item) return null;
      
      const volumeInfo = item.volumeInfo ?? {};
      const imageLinks = volumeInfo.imageLinks ?? {};
      
      // Extraer el año de la fecha de publicación si existe
      let publishedYear = null;
      if (volumeInfo.publishedDate) {
        // Puede ser solo año "2021" o fecha completa "2021-05-15"
        const yearMatch = volumeInfo.publishedDate.match(/^(\d{4})/);
        publishedYear = yearMatch ? yearMatch[1] : null;
      }
      
      // Corregir URLs de imágenes para usar HTTPS
      let thumbnailUrl = imageLinks.thumbnail ?? null;
      if (thumbnailUrl?.startsWith('http:')) {
        thumbnailUrl = thumbnailUrl.replace('http:', 'https:');
      }
      
      return {
        id: item.id,
        titulo: volumeInfo.title ?? 'Título desconocido',
        sinopsis: volumeInfo.description ?? 'No hay descripción disponible',
        anioPublicacion: publishedYear,
        genero: volumeInfo.categories && volumeInfo.categories.length > 0 ? volumeInfo.categories[0] : null,
        portadaUrl: thumbnailUrl,
        paginas: volumeInfo.pageCount ?? null,
        autores: volumeInfo.authors ?? [],
        googleBookItem: item, // Guardamos el objeto original para usarlo en la importación
        isGoogleBook: true
      };
    }).filter(item => item !== null); // Eliminar posibles valores null
  }
  
  // Método para importar un libro desde Google Books
  importBookFromGoogle(googleBookId: string, event: Event): void {
    event.stopPropagation();
    
    if (!googleBookId) {
      return;
    }
    
    // Encontrar el libro en los resultados
    const bookIndex = this.results.findIndex(book => book.id === googleBookId);
    if (bookIndex === -1) return;
    
    // Marcar el libro como en proceso de importación
    this.results[bookIndex].importing = true;
    
    this.googleBooksService.importBook(googleBookId)
      .subscribe({
        next: (importedBook) => {
          console.log('[Buscador] Libro importado exitosamente', importedBook);
          this.results[bookIndex].importing = false;
          this.results[bookIndex].imported = true;
          
          // Opcional: cambiar a búsqueda local después de un tiempo para mostrar el libro importado
          setTimeout(() => {
            this.isGoogleSearch = false;
            this.search(); // Realizar búsqueda local para mostrar el libro importado
          }, 1500);
        },
        error: (error) => {
          console.error('[Buscador] Error al importar libro', error);
          this.results[bookIndex].importing = false;
          this.results[bookIndex].error = true;
        }
      });
  }

  pageChanged(event: PageChangeEvent): void {
    // Obtenemos la página desde el evento
    const page = event.page;
    const oldPageSize = this.pageSize;
    
    // Si hay un cambio en el tamaño de página, lo actualizamos
    if (event.pageSize !== undefined && event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
      this.googleBooksMaxResults = event.pageSize;
    }
    
    // Solo cargar nuevos datos si: 1) cambió la página 2) cambió el tamaño de página
    if (this.currentPage !== page || event.pageSize !== oldPageSize) {
      console.log(`[Buscador] Cambiando página: de ${this.currentPage + 1} a ${page + 1}, tamaño: ${this.pageSize}`);
      this.currentPage = page;
      this.loading = true; // Mostrar indicador de carga
      this.hasError = false; // Reiniciar estado de error
      
      // Obtener el tipo de búsqueda actual del formulario
      const searchType = this.searchForm.get('searchType')?.value ?? 'libros';
      
      if (searchType === 'libros') {
        if (!this.isGoogleSearch) {
          // Búsqueda local de libros
          this.librosService.searchLibros(this.lastSearchTerm, {}, page, this.pageSize)
            .subscribe({
              next: (data) => {
                this.results = data.content;
                this.totalItems = data.totalElements;
                this.loading = false;
                console.log(`[Buscador] Búsqueda local completada - Página ${page+1}, mostrando ${this.results.length} resultados de ${this.totalItems} totales`);
              },
              error: (error) => {
                console.error('[Buscador] Error al buscar libros localmente', error);
                this.loading = false;
                this.results = [];
                this.hasError = true;
                this.errorMessage = 'Error al buscar en la biblioteca local. Por favor, inténtalo de nuevo.';
              }
            });
        } else {
          // Para Google Books, recalcular el índice de inicio basado en la página actual
          this.googleBooksStartIndex = this.currentPage * this.googleBooksMaxResults;
          
          // Verificar si estamos intentando acceder a una página más allá del límite práctico (100 resultados)
          const GOOGLE_MAX_RESULTS = 100; // Límite de 100 para mejor rendimiento
          if (this.googleBooksStartIndex >= GOOGLE_MAX_RESULTS) {
            console.warn(`[Buscador] StartIndex ${this.googleBooksStartIndex} excede el límite práctico de Google Books (${GOOGLE_MAX_RESULTS})`);
            
            // Ajustar a la última página posible
            const lastValidPage = Math.floor((GOOGLE_MAX_RESULTS - 1) / this.googleBooksMaxResults);
            if (page > lastValidPage) {
              this.currentPage = lastValidPage;
              this.googleBooksStartIndex = this.currentPage * this.googleBooksMaxResults;
              console.log(`[Buscador] Ajustado a la última página válida: ${this.currentPage+1}, startIndex=${this.googleBooksStartIndex}`);
            }
          }
          
          console.log(`[Buscador] Cambiando página en Google Books: página ${this.currentPage+1}/${Math.ceil(this.totalItems/this.pageSize)}, startIndex=${this.googleBooksStartIndex}, pageSize=${this.googleBooksMaxResults}`);
          
          console.log(`[Buscador] Cambiando página en Google Books: página ${this.currentPage+1}, startIndex ${this.googleBooksStartIndex}`);
          this.searchGoogleBooks(this.lastSearchTerm);
        }
      } else {
        // Búsqueda de autores (siempre local)
        this.autorService.searchAutores(this.lastSearchTerm, page, this.pageSize)
          .subscribe({
            next: (data) => {
              this.results = data.content;
              this.totalItems = data.totalElements;
              this.loading = false;
              console.log(`[Buscador] Búsqueda de autores completada - Página ${page+1}, mostrando ${this.results.length} autores de ${this.totalItems} totales`);
            },
            error: (error) => {
              console.error('[Buscador] Error al buscar autores', error);
              this.loading = false;
              this.results = [];
              this.hasError = true;
              this.errorMessage = 'Error al buscar autores. Por favor, inténtalo de nuevo.';
            }
          });
      }
    }
  }
}
