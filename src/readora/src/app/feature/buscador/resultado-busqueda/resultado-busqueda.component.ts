import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LibrosService } from '../../../core/services/libros.service';

// Interfaz para el evento de cambio de página
export interface PageChangeEvent {
  page: number;
  pageSize?: number;
}

@Component({
  selector: 'app-resultado-busqueda',
  templateUrl: './resultado-busqueda.component.html',
  styleUrls: ['./resultado-busqueda.component.css'],
  
  imports: [CommonModule, RouterModule, FormsModule],
  providers: [StorageService]
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
  librosAgregando: Set<number> = new Set(); 
  librosEliminando: Set<number> = new Set(); 
  librosEnBiblioteca: Map<number, number> = new Map(); 
  libroAutores: Map<number, string[]> = new Map(); 

  // Rutas para imágenes predeterminadas
  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  // Exponiendo Math para su uso en el template
  Math = Math;
  
  constructor(
    private router: Router,
    private storageService: StorageService,
    private usuarioLibroService: UsuarioLibroService,
    private autenticacionService: AutenticacionService,
    private notificationService: NotificationService,
    private librosService: LibrosService
  ) {
    // Comprobar si el usuario está autenticado
    this.autenticacionService.isLoggedIn().subscribe(isLoggedIn => {
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
      if (libro.id) {
        this.librosService.getAutoresByLibroId(libro.id).subscribe({
          next: (autores) => {
            if (autores && autores.length > 0) {
              // Guardar los nombres de los autores para este libro
              this.libroAutores.set(
                libro.id, 
                autores.map(autor => autor.nombre + (autor.apellido ? ' ' + autor.apellido : ''))
              );
            }
          },
          error: (err) => {
            console.error(`Error al cargar autores para el libro ${libro.id}:`, err);
          }
        });
      }
    });
  }
  
  /**
   * Obtiene los autores de un libro específico para mostrar
   */
  getAutores(libroId: number): string {
    const autores = this.libroAutores.get(libroId);
    if (!autores || autores.length === 0) {
      return 'Autor desconocido';
    }
    
    if (autores.length === 1) {
      return autores[0];
    }
    
    if (autores.length === 2) {
      return `${autores[0]} y ${autores[1]}`;
    }
    
    return `${autores[0]} y ${autores.length - 1} más`;
  }
  
  /**
   * Verifica qué libros de los resultados ya están en la biblioteca del usuario
   */
  verificarLibrosEnBiblioteca(): void {
    if (!this.usuarioId) return;
    
    this.usuarioLibroService.getLibrosByUsuarioId(this.usuarioId).subscribe({
      next: (usuarioLibros) => {
        // Limpiar el mapa actual
        this.librosEnBiblioteca.clear();
        
        // Llenar el mapa con los libros que el usuario ya tiene
        if (usuarioLibros && usuarioLibros.length > 0) {
          usuarioLibros.forEach(usuarioLibro => {
            if (usuarioLibro.id !== undefined) {
              this.librosEnBiblioteca.set(usuarioLibro.libroId, usuarioLibro.id);
            }
          });
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
  libroEstaEnBiblioteca(libroId: number): boolean {
    return this.librosEnBiblioteca.has(libroId);
  }
  
  /**
   * Obtiene el ID de la relación usuario-libro para un libro específico
   */
  getUsuarioLibroId(libroId: number): number | undefined {
    return this.librosEnBiblioteca.get(libroId);
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
   * Detiene la propagación del evento si viene del botón de añadir a biblioteca
   */
  navigateToDetails(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isBooks) {
      this.router.navigate(['/libros', item.id]);
    } else {
      this.router.navigate(['/autores', item.id]);
    }
  }

  /**
   * Añade un libro a la biblioteca personal del usuario
   * @param libro El libro a añadir
   * @param event El evento del click para evitar navegación
   */
  agregarABiblioteca(libro: any, event: Event): void {
    event.stopPropagation(); // Evitar que se abra la página de detalles
    
    if (!this.isLoggedIn || !this.usuarioId) {
      this.notificationService.warning('Inicio de sesión requerido', { 
        description: 'Debes iniciar sesión para añadir libros a tu biblioteca'
      });
      return;
    }
    
    // Marcar como "añadiendo" para deshabilitar el botón
    this.librosAgregando.add(libro.id);
    
    const nuevoUsuarioLibro = {
      usuarioId: this.usuarioId,
      libroId: libro.id,
      estadoLectura: 'PENDIENTE', // Por defecto se añade como pendiente
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
        this.librosAgregando.delete(libro.id);
        
        // Actualizar el estado local para mostrar el botón de Eliminar
        if (response && response.id) {
          this.librosEnBiblioteca.set(libro.id, response.id);
        }
      },
      error: (error) => {
        this.librosAgregando.delete(libro.id);
        
        // Comprobar si es un error de libro ya existente
        if (error.status === 409) {
          this.notificationService.warning('Libro ya en biblioteca', { 
            description: 'Este libro ya está en tu biblioteca'
          });
          
          // Actualizar el estado local para mostrar el botón de Eliminar aunque ya existiera
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
        this.librosEliminando.add(libro.id);
        
        this.usuarioLibroService.deleteUsuarioLibro(usuarioLibroId as number).subscribe({
          next: () => {
            this.notificationService.success('Libro eliminado', {
              description: 'El libro ha sido eliminado de tu biblioteca'
            });
            
            // Actualizar estado local
            this.librosEnBiblioteca.delete(libro.id);
            this.librosEliminando.delete(libro.id);
          },
          error: (error) => {
            console.error('[ResultadoBusqueda] Error al eliminar libro de la biblioteca', error);
            this.librosEliminando.delete(libro.id);
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