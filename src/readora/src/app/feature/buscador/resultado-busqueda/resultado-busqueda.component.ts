import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LibrosService } from '../../../core/services/libros.service';
import { GoogleBooksService } from '../../../core/services/google-books.service';
import { ImportAnimationComponent } from '../../../shared/components/import-animation/import-animation.component';

// Interfaz para el evento de cambio de página
export interface PageChangeEvent {
  page: number;
  pageSize?: number;
}

@Component({
  selector: 'app-resultado-busqueda',
  templateUrl: './resultado-busqueda.component.html',
  styleUrls: ['./resultado-busqueda.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImportAnimationComponent]
})
export class ResultadoBusquedaComponent implements OnChanges {
  @Input() results: any[] = [];
  @Input() isBooks: boolean = true;
  @Input() totalItems: number = 0;
  @Input() currentPage: number = 0;
  @Input() pageSize: number = 10;
  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  totalPages: number = 0;
  pages: number[] = [];
  usuarioId: number | null = null;
  isLoggedIn = false;
  librosAgregando: Set<string | number> = new Set(); 
  librosEliminando: Set<string | number> = new Set(); 
  librosEnBiblioteca: Map<string, number> = new Map(); 
  libroAutores: Map<string, string[]> = new Map();   librosImportando: Set<string> = new Set(); // Para trackear libros de Google Books que se están importando

  // Propiedades para controlar la animación de importación
  showImportAnimation = false;
  importingBookTitle = '';

  // Rutas para imágenes predeterminadas
  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  // Exponiendo Math para su uso en el template
  Math = Math;

  // Inyección de dependencias usando inject()
  private router = inject(Router);
  private storageService = inject(StorageService);
  private usuarioLibroService = inject(UsuarioLibroService);
  private autenticacionService = inject(AutenticacionService);
  private notificationService = inject(NotificationService);
  private librosService = inject(LibrosService);
  private googleBooksService = inject(GoogleBooksService);
  
  constructor() {
    // Comprobar si el usuario está autenticado
    this.autenticacionService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.cargarDatosUsuario();
      }
    });
  }

  /**
   * Carga los datos del usuario autenticado
   */
  cargarDatosUsuario(): void {
    this.autenticacionService.getUserInfo().subscribe({
      next: (userData) => {
        if (userData && userData.id) {
          this.usuarioId = userData.id;
          if (this.isBooks && this.results.length > 0) {
            this.verificarLibrosEnBiblioteca();
          }
        }
      },
      error: (error) => {
        console.error('[ResultadoBusqueda] Error al obtener información del usuario', error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si hay cambios en totalItems o pageSize, recalcular el número total de páginas
    if (changes['totalItems'] || changes['pageSize']) {
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    }
    
    // Si hay cambios en los resultados, hacer scroll hacia arriba y verificar libros en biblioteca
    if (changes['results'] && this.results.length > 0) {
      window.scrollTo(0, 0);
      
      // Cargar los autores para cada libro
      if (this.isBooks) {
        this.cargarAutoresDeTodosLosLibros();
      }
      
      // Verificar libros en biblioteca si el usuario está logueado
      if (this.isLoggedIn && this.usuarioId && this.isBooks) {
        this.verificarLibrosEnBiblioteca();
      }
    }
  }
  
  /**
   * Carga los autores para todos los libros en los resultados
   */
  cargarAutoresDeTodosLosLibros(): void {
    // Limpiar el mapa de autores
    this.libroAutores.clear();
    
    // Para cada libro, cargar sus autores
    this.results.forEach(libro => {
      // Si el libro es de Google Books, tomamos los autores directamente del objeto
      if (libro.isGoogleBook && libro.autores) {
        // Ya tenemos los autores, simplemente los guardamos
        this.libroAutores.set(String(libro.id), libro.autores);
        console.log(`[ResultadoBusqueda] Usando autores de Google Books para libro ${libro.id}`);
      } 
      // Si es un libro de la base de datos local, cargamos los autores mediante API
      else if (libro.id && !libro.isGoogleBook) {
        console.log(`[ResultadoBusqueda] Cargando autores para libro local ${libro.id}`);
        this.librosService.getAutoresByLibroId(libro.id).subscribe({
          next: (autores) => {
            if (autores && autores.length > 0) {
              // Guardar los nombres de los autores para este libro
              const nombreAutores = autores.map(autor => autor.nombre + (autor.apellido ? ' ' + autor.apellido : ''));
              this.libroAutores.set(String(libro.id), nombreAutores);
              console.log(`[ResultadoBusqueda] Autores cargados para libro ${libro.id}: ${nombreAutores.join(', ')}`);
            }
          },
          error: (err) => {
            console.error(`[ResultadoBusqueda] Error al cargar autores para el libro ${libro.id}:`, err);
          }
        });
      }
    });
  }
  
  /**
   * Obtiene los autores de un libro específico para mostrar
   */
  getAutores(libroId: number | string): string {
    // Buscar primero en el mapa de autores cargados
    // Convertir libroId a string para usar como clave en el Map
    const id = String(libroId);
    const autores = this.libroAutores.get(id);
    if (autores && autores.length > 0) {
      if (autores.length === 1) {
        return autores[0];
      }
      
      if (autores.length === 2) {
        return `${autores[0]} y ${autores[1]}`;
      }
      
      return `${autores[0]} y ${autores.length - 1} más`;
    }
    
    // Para libros de Google Books, intentar obtener los autores directamente del objeto
    const libro = this.results.find(item => item.id === libroId);
    if (libro?.isGoogleBook && libro?.autores?.length > 0) {
      const googleAutores = libro.autores;
      // Guardar en el mapa para futuras referencias
      this.libroAutores.set(String(libroId), googleAutores);
      
      if (googleAutores.length === 1) {
        return googleAutores[0];
      }
      
      if (googleAutores.length === 2) {
        return `${googleAutores[0]} y ${googleAutores[1]}`;
      }
      
      return `${googleAutores[0]} y ${googleAutores.length - 1} más`;
    }
    
    // Si no hay autores, devolver mensaje por defecto
    return 'Autor desconocido';
  }
  
  /**
   * Verifica qué libros de los resultados ya están en la biblioteca del usuario
   */
  verificarLibrosEnBiblioteca(): void {
    if (!this.usuarioId) return;
    
    // Filtramos solo los libros locales (no de Google Books) ya que estos son los únicos que podrían estar en la BD
    const librosLocales = this.results.filter(libro => libro.id && !libro.isGoogleBook);
    
    if (librosLocales.length === 0) {
      console.log('[ResultadoBusqueda] No hay libros locales para verificar en la biblioteca');
      return;
    }
    
    console.log(`[ResultadoBusqueda] Verificando ${librosLocales.length} libros locales en la biblioteca del usuario ${this.usuarioId}`);
    
    this.usuarioLibroService.getLibrosByUsuarioId(this.usuarioId).subscribe({
      next: (usuarioLibros) => {
        // Limpiar el mapa actual, pero solo para libros locales (no Google Books)
        this.results.forEach(libro => {
          if (!libro.isGoogleBook && this.librosEnBiblioteca.has(String(libro.id))) {
            this.librosEnBiblioteca.delete(String(libro.id));
          }
        });
        
        // Llenar el mapa con los libros que el usuario ya tiene
        if (usuarioLibros && usuarioLibros.length > 0) {
          usuarioLibros.forEach(usuarioLibro => {
            if (usuarioLibro.id !== undefined && usuarioLibro.libroId !== undefined) {
              this.librosEnBiblioteca.set(String(usuarioLibro.libroId), usuarioLibro.id);
              console.log(`[ResultadoBusqueda] Libro ${usuarioLibro.libroId} encontrado en la biblioteca (relación: ${usuarioLibro.id})`);
            }
          });
          console.log(`[ResultadoBusqueda] Se encontraron ${usuarioLibros.length} libros del usuario en la biblioteca`);
        } else {
          console.log('[ResultadoBusqueda] El usuario no tiene libros en su biblioteca');
        }
      },
      error: (error) => {
        console.error('[ResultadoBusqueda] Error al verificar libros en biblioteca', error);
      }
    });
  }
  
  /**
   * Comprueba si un libro ya está en la biblioteca del usuario
   */
  libroEstaEnBiblioteca(libroId: number | string): boolean {
    if (libroId === undefined || libroId === null) {
      return false;
    }
    // Siempre trabajar con string para los IDs ya que los de Google Books son strings
    return this.librosEnBiblioteca.has(String(libroId));
  }
  
  /**
   * Obtiene el ID de la relación usuario-libro para un libro específico
   */
  getUsuarioLibroId(libroId: number | string): number | undefined {
    if (libroId === undefined || libroId === null) {
      return undefined;
    }
    // Siempre trabajar con string para los IDs ya que los de Google Books son strings
    return this.librosEnBiblioteca.get(String(libroId));
  }

  /**
   * Calcula la paginación basándose en el total de items y el tamaño de página
   */
  calcularPaginacion(): void {
    // Calcular el número total de páginas
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Crear array de páginas para la paginación
    this.pages = [];
    
    // Si no hay páginas, salimos
    if (this.totalPages === 0) {
      return;
    }
    
    // Para un número moderado de páginas (hasta 7), mostrar todas las páginas sin separadores
    if (this.totalPages <= 7) {
      for (let i = 0; i < this.totalPages; i++) {
        this.pages.push(i);
      }
    } else {
      this.pages.push(0);
      
      if (this.currentPage > 2) {
        this.pages.push(-1); // -1 representa un separador "..."
      }
      
      const startPage = Math.max(1, this.currentPage - 1);
      const endPage = Math.min(this.totalPages - 2, this.currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        this.pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 3) {
        this.pages.push(-1);
      }
      
      this.pages.push(this.totalPages - 1);
    }
    
    // Eliminar duplicados
    this.pages = this.pages.filter((value, index, self) => self.indexOf(value) === index);
  }

  changePage(page: number): void {
    if (page !== this.currentPage && page >= 0 && page < this.totalPages) {
      this.pageChange.emit({ page });
    }
  }
  
  /**
   * Cambia el tamaño de página y reinicia a la primera página
   */
  changePageSize(): void {
    // Al cambiar el tamaño de página, enviamos un objeto con la información
    this.pageChange.emit({
      page: 0,
      pageSize: Number(this.pageSize) // Aseguramos que sea número
    });
  }

  /**
   * Navega a la página de detalles del elemento seleccionado
   * Para libros de Google Books, primero los importa automáticamente
   */
  navigateToDetails(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isBooks) {
      // Si es un libro de Google Books, importarlo primero
      if (item.isGoogleBook) {
        this.importBookAndNavigate(item);
      } else {
        // Libro local, navegar directamente
        this.router.navigate(['/libros', item.id]);
      }
    } else {
      this.router.navigate(['/autores', item.id]);
    }
  }
  /**
   * Importa un libro de Google Books y luego navega a sus detalles
   */
  private importBookAndNavigate(googleBook: any): void {
    if (this.librosImportando.has(googleBook.id)) {
      return; // Ya se está importando
    }

    this.librosImportando.add(googleBook.id);
    
    // Mostrar la animación de importación
    this.importingBookTitle = googleBook.volumeInfo?.title || 'Libro';
    this.showImportAnimation = true;
    
    this.googleBooksService.importBook(googleBook.id).subscribe({
      next: (importedBook) => {
        console.log('[ResultadoBusqueda] Libro importado exitosamente para navegación', importedBook);
        this.librosImportando.delete(googleBook.id);
        
        // Ocultar la animación después de un breve delay
        setTimeout(() => {
          this.showImportAnimation = false;
          // Navegar a la página de detalles del libro importado
          this.router.navigate(['/libros', importedBook.id]);
        }, 1500);
      },
      error: (error) => {
        console.error('[ResultadoBusqueda] Error al importar libro para navegación', error);
        this.librosImportando.delete(googleBook.id);
        
        // Ocultar la animación en caso de error
        this.showImportAnimation = false;
        
        if (error.status === 409) {
          // El libro ya existe, intentar encontrarlo por ISBN para navegar
          this.findExistingBookAndNavigate(googleBook);
        } else {
          this.notificationService.error('Error', {
            description: 'No se pudo acceder a los detalles del libro'
          });
        }
      }
    });
  }

  /**
   * Busca un libro existente por ISBN cuando la importación falla por duplicado
   */
  private findExistingBookAndNavigate(googleBook: any): void {
    // Intentar extraer ISBN del libro de Google Books
    const isbn = this.extractISBNFromGoogleBook(googleBook);
    
    if (isbn) {
      // Buscar el libro por ISBN en la base de datos local
      this.librosService.searchLibros(isbn, {}, 0, 10).subscribe({
        next: (searchResult) => {
          if (searchResult.content && searchResult.content.length > 0) {
            // Encontrado, navegar al primero que coincida
            const existingBook = searchResult.content[0];
            this.router.navigate(['/libros', existingBook.id]);
          } else {
            this.notificationService.warning('Libro no encontrado', {
              description: 'No se pudo encontrar el libro en la biblioteca local'
            });
          }
        },
        error: (searchError) => {
          console.error('[ResultadoBusqueda] Error al buscar libro existente', searchError);
          this.notificationService.error('Error', {
            description: 'No se pudo acceder a los detalles del libro'
          });
        }
      });
    } else {
      this.notificationService.warning('Libro ya existe', {
        description: 'El libro ya está en la biblioteca pero no se pudo encontrar'
      });
    }
  }

  /**
   * Extrae el ISBN de un libro de Google Books
   */
  private extractISBNFromGoogleBook(googleBook: any): string | null {
    const volumeInfo = googleBook.googleBookItem?.volumeInfo || {};
    const industryIdentifiers = volumeInfo.industryIdentifiers || [];
    
    // Buscar ISBN_13 primero, luego ISBN_10
    for (const identifier of industryIdentifiers) {
      if (identifier.type === 'ISBN_13' || identifier.type === 'ISBN_10') {
        return identifier.identifier;
      }
    }
    
    return null;
  }

  /**
   * Añade un libro a la biblioteca personal del usuario
   * Para libros de Google Books, primero los importa automáticamente
   */
  agregarABiblioteca(libro: any, event: Event): void {
    event.stopPropagation(); // Evitar que se abra la página de detalles
    
    if (!this.isLoggedIn || !this.usuarioId) {
      this.notificationService.warning('Inicio de sesión requerido', { 
        description: 'Debes iniciar sesión para añadir libros a tu biblioteca'
      });
      return;
    }
    
    // Si es un libro de Google Books, importarlo primero
    if (libro.isGoogleBook) {
      this.importBookAndAddToLibrary(libro);
    } else {
      // Libro local, agregar directamente
      this.addLocalBookToLibrary(libro);
    }
  }

  /**
   * Importa un libro de Google Books y luego lo agrega a la biblioteca
   */
  private importBookAndAddToLibrary(googleBook: any): void {
    if (this.librosImportando.has(googleBook.id)) {
      return; // Ya se está importando
    }

    // Verificar primero si el libro ya existe para no mostrar animación innecesaria
    const isbn = this.extractISBNFromGoogleBook(googleBook);
    
    if (isbn) {
      console.log(`[ResultadoBusqueda] Verificando si el libro con ISBN ${isbn} ya existe...`);
      this.librosService.searchLibros(isbn, {}, 0, 1).subscribe({
        next: (searchResult) => {
          if (searchResult.content && searchResult.content.length > 0) {
            // El libro ya existe, agregarlo directamente sin importar
            const existingBook = searchResult.content[0];
            console.log(`[ResultadoBusqueda] Libro ya existe con ID ${existingBook.id}, agregando a biblioteca directamente`);
            googleBook.localId = existingBook.id;
            this.addLocalBookToLibrary(existingBook);
          } else {
            // El libro no existe, proceder con la importación con animación
            console.log(`[ResultadoBusqueda] Libro no existe, procediendo con importación...`);
            this.performBookImport(googleBook);
          }
        },
        error: (error) => {
          console.warn(`[ResultadoBusqueda] Error al verificar existencia del libro, procediendo con importación:`, error);
          // Si hay error en la verificación, proceder con la importación normal
          this.performBookImport(googleBook);
        }
      });
    } else {
      // No hay ISBN, proceder con la importación normal
      console.log(`[ResultadoBusqueda] No se pudo extraer ISBN, procediendo con importación...`);
      this.performBookImport(googleBook);
    }
  }
  /**
   * Realiza la importación real del libro con animación
   */
  private performBookImport(googleBook: any): void {
    this.librosImportando.add(googleBook.id);
    
    // Mostrar la animación de importación
    this.importingBookTitle = googleBook.volumeInfo?.title || 'Libro';
    this.showImportAnimation = true;
    
    this.googleBooksService.importBook(googleBook.id).subscribe({
      next: (importedBook) => {
        console.log('[ResultadoBusqueda] Libro importado exitosamente para biblioteca', importedBook);
        this.librosImportando.delete(googleBook.id);
        
        // Ocultar la animación después de un breve delay para que el usuario pueda ver la completación
        setTimeout(() => {
          this.showImportAnimation = false;
        }, 1500);
        
        // Actualizar el objeto Google Book con el ID local para sincronizar el estado
        googleBook.localId = importedBook.id;
        
        // Ahora agregar el libro importado a la biblioteca
        this.addLocalBookToLibrary(importedBook);
        
        // Actualizar también el mapa para el ID de Google Books para mantener consistencia
        // Esto permite que el botón cambie de estado inmediatamente
        const localLibraryEntry = this.librosEnBiblioteca.get(String(importedBook.id));
        if (localLibraryEntry) {
          this.librosEnBiblioteca.set(String(googleBook.id), localLibraryEntry);
        }
      },
      error: (error) => {
        console.error('[ResultadoBusqueda] Error al importar libro para biblioteca', error);
        this.librosImportando.delete(googleBook.id);
        
        // Ocultar la animación en caso de error
        this.showImportAnimation = false;
        
        if (error.status === 409) {
          // El libro ya existe, intentar encontrarlo y agregarlo a la biblioteca
          this.findExistingBookAndAddToLibrary(googleBook);
        } else {
          this.notificationService.error('Error', {
            description: 'No se pudo agregar el libro a tu biblioteca'
          });
        }
      }
    });
  }

  /**
   * Busca un libro existente por ISBN cuando la importación falla por duplicado
   * y luego lo agrega a la biblioteca
   */
  private findExistingBookAndAddToLibrary(googleBook: any): void {
    const isbn = this.extractISBNFromGoogleBook(googleBook);
    
    if (isbn) {
      this.librosService.searchLibros(isbn, {}, 0, 10).subscribe({
        next: (searchResult) => {
          if (searchResult.content && searchResult.content.length > 0) {
            const existingBook = searchResult.content[0];
            
            // Actualizar el objeto Google Book con el ID local para sincronización
            googleBook.localId = existingBook.id;
            
            this.addLocalBookToLibrary(existingBook);
          } else {
            this.notificationService.warning('Libro no encontrado', {
              description: 'No se pudo encontrar el libro en la biblioteca local'
            });
          }
        },
        error: (searchError) => {
          console.error('[ResultadoBusqueda] Error al buscar libro existente para biblioteca', searchError);
          this.notificationService.error('Error', {
            description: 'No se pudo agregar el libro a tu biblioteca'
          });
        }
      });
    } else {
      this.notificationService.warning('Libro ya existe', {
        description: 'El libro ya está en la biblioteca pero no se pudo agregar'
      });
    }
  }

  /**
   * Agrega un libro local a la biblioteca del usuario
   */
  private addLocalBookToLibrary(libro: any): void {
    if (!this.usuarioId) {
      this.notificationService.error('Error', {
        description: 'No se pudo identificar al usuario'
      });
      return;
    }

    // Marcar como "añadiendo" para deshabilitar el botón
    this.librosAgregando.add(String(libro.id));
    
    const nuevoUsuarioLibro = {
      usuarioId: this.usuarioId,
      libroId: libro.id,
      estadoLectura: 'PENDIENTE',
      valoracion: null,
      comentario: '',
      fechaInicioLectura: null,
      fechaFinLectura: null
    };
    
    this.usuarioLibroService.createUsuarioLibro(nuevoUsuarioLibro).subscribe({
      next: (response) => {
        this.notificationService.success('Libro añadido', {
          description: 'El libro ha sido añadido a tu biblioteca con éxito'
        });
        this.librosAgregando.delete(String(libro.id));
        
        // Actualizar el estado local para mostrar el botón de Eliminar
        if (response && response.id) {
          this.librosEnBiblioteca.set(String(libro.id), response.id);
          
          // Si el libro proviene de Google Books, también actualizar con su ID original
          // para que el botón cambie de estado inmediatamente en la interfaz
          const googleBookInResults = this.results.find(result => 
            result.isGoogleBook && result.localId === libro.id
          );
          if (googleBookInResults) {
            this.librosEnBiblioteca.set(String(googleBookInResults.id), response.id);
            console.log(`[ResultadoBusqueda] Sincronizado estado de biblioteca para Google Book ${googleBookInResults.id} -> Local Book ${libro.id}`);
          }
        }
      },
      error: (error) => {
        this.librosAgregando.delete(String(libro.id));
        
        if (error.status === 409) {
          this.notificationService.warning('Libro ya en biblioteca', { 
            description: 'Este libro ya está en tu biblioteca'
          });
          this.verificarLibrosEnBiblioteca();
        } else {
          this.notificationService.error('Error', {
            description: 'No se pudo añadir el libro a la biblioteca'
          });
        }
      }
    });
  }

  /**
   * Elimina un libro de la biblioteca personal del usuario
   * @param libro El libro a eliminar
   * @param event El evento del click para evitar navegación
   */
  eliminarDeColeccion(libro: any, event: Event): void {
    event.stopPropagation(); // Evitar que se abra la página de detalles
    
    if (!this.isLoggedIn || !this.usuarioId) {
      return;
    }
    
    const usuarioLibroId = this.getUsuarioLibroId(libro.id);
    if (!usuarioLibroId) {
      return;
    }
    
    this.notificationService.confirm({
      title: '¿Eliminar libro?',
      text: '¿Estás seguro de eliminar este libro de tu biblioteca?',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (resultado) {
        this.librosEliminando.add(String(libro.id));
        
        this.usuarioLibroService.deleteUsuarioLibro(usuarioLibroId).subscribe({
          next: () => {
            this.notificationService.success('Libro eliminado', {
              description: 'El libro ha sido eliminado de tu biblioteca'
            });
            
            // Actualizar estado local
            this.librosEnBiblioteca.delete(String(libro.id));
            this.librosEliminando.delete(String(libro.id));
            
            // Si es un libro que originalmente venía de Google Books, también eliminar su entrada
            const googleBookInResults = this.results.find(result => 
              result.isGoogleBook && result.localId === libro.id
            );
            if (googleBookInResults) {
              this.librosEnBiblioteca.delete(String(googleBookInResults.id));
              console.log(`[ResultadoBusqueda] Eliminado del estado: Google Book ${googleBookInResults.id} y Local Book ${libro.id}`);
            }
          },
          error: (error) => {
            console.error('[ResultadoBusqueda] Error al eliminar libro de la biblioteca', error);
            this.librosEliminando.delete(String(libro.id));
            this.notificationService.error('Error', {
              description: 'No se pudo eliminar el libro de tu biblioteca'
            });
          }
        });
      }
    });
  }

  getImageUrl(item: any): string {
    if (this.isBooks) {
      if (!item.portadaUrl) {
        return this.libroPlaceholder;
      }
      return this.storageService.getFullImageUrl(item.portadaUrl);
    }
    return this.libroPlaceholder;
  }

  getAuthorImageUrl(item: any): string {
    if (!this.isBooks) {
      if (!item.fotoUrl) {
        return this.autorPlaceholder;
      }
      return this.storageService.getFullImageUrl(item.fotoUrl);
    }
    return this.autorPlaceholder;
  }
}