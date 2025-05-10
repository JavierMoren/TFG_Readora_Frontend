import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';

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
  librosAgregando: Set<number> = new Set(); // Para controlar los botones de "Añadiendo..."
  librosEliminando: Set<number> = new Set(); // Para controlar los botones de "Eliminando..."
  librosEnBiblioteca: Map<number, number> = new Map(); // Mapa de ID libro -> ID relación usuario-libro

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
    private notificationService: NotificationService
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
    if (changes['results'] && !changes['results'].firstChange) {
      window.scrollTo(0, 0);
      if (this.isLoggedIn && this.usuarioId && this.isBooks && this.results.length > 0) {
        this.verificarLibrosEnBiblioteca();
      }
    }
  }
  
  /**
   * Verifica qué libros de los resultados ya están en la biblioteca del usuario
   */
  verificarLibrosEnBiblioteca(): void {
    if (!this.usuarioId) return;
    
    console.log('[ResultadoBusqueda] Verificando libros en biblioteca del usuario');
    
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
          
          console.log(`[ResultadoBusqueda] Usuario tiene ${this.librosEnBiblioteca.size} libros en su biblioteca`);
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
    console.log(`[ResultadoBusqueda] Calculando paginación: ${this.totalItems} items, página ${this.currentPage + 1}, tamaño ${this.pageSize}`);
    
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
    
    console.log('[ResultadoBusqueda] Páginas generadas:', this.pages);
  }

  changePage(page: number): void {
    console.log(`[ResultadoBusqueda] Usuario seleccionó página: ${page + 1}`);
    if (page !== this.currentPage && page >= 0 && page < this.totalPages) {
      this.pageChange.emit({ page });
    }
  }
  
  /**
   * Cambia el tamaño de página y reinicia a la primera página
   */
  changePageSize(): void {
    console.log(`[ResultadoBusqueda] Usuario cambió tamaño de página a: ${this.pageSize}`);
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
    console.log('[ResultadoBusqueda] Intentando añadir libro a biblioteca:', libro.id);
    
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
        console.log('[ResultadoBusqueda] Libro añadido correctamente a la biblioteca');
        this.notificationService.success('Libro añadido', {
          description: 'El libro ha sido añadido a tu biblioteca con éxito'
        });
        this.librosAgregando.delete(libro.id);
      },
      error: (error) => {
        console.error('[ResultadoBusqueda] Error al añadir libro a la biblioteca', error);
        this.librosAgregando.delete(libro.id);
        
        // Comprobar si es un error de libro ya existente
        if (error.status === 409) {
          this.notificationService.warning('Libro ya en biblioteca', { 
            description: 'Este libro ya está en tu biblioteca'
          });
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
    
    console.log(`[ResultadoBusqueda] Eliminando libro ${libro.id} de la biblioteca, relación: ${usuarioLibroId}`);
    
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
            console.log('[ResultadoBusqueda] Libro eliminado correctamente de la biblioteca');
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