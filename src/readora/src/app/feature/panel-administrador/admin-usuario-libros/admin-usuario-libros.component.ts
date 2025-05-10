import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioLibro } from '../../../models/usuario-libro/usuario-libro.model';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { LibroService } from '../../../core/services/libro.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Libro } from '../../../models/libro/libro.model';
import { Usuario } from '../../../models/usuario/usuario.model';

@Component({
  selector: 'app-admin-usuario-libros',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuario-libros.component.html',
  styleUrl: './admin-usuario-libros.component.css'
})
export class AdminUsuarioLibrosComponent implements OnInit {
  // Array para almacenar todas las relaciones usuario-libro
  usuarioLibros: UsuarioLibro[] = [];
  // Relación actual que se está creando o editando
  currentUsuarioLibro: any = this.initializeUsuarioLibro();
  // Detalles de la relación seleccionada
  usuarioLibroDetalle: UsuarioLibro | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Eliminar registro de lectura?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  usuarioLibroIdToDelete: number | null = null;

  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  Math = Math;

  // La función getPagesArray() se ha eliminado ya que ahora usamos una paginación simplificada

  constructor(
    private usuarioLibroService: UsuarioLibroService,
    private usuarioService: UsuarioService,
    private libroService: LibroService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Carga las relaciones paginadas al inicializar el componente
    this.getUsuarioLibrosPaginados();
  }

  /**
   * Obtiene las relaciones usuario-libro paginadas mediante el servicio
   * y enriquece los datos con información detallada de usuarios y libros
   */
  getUsuarioLibrosPaginados(): void {
    this.usuarioLibroService.getUsuarioLibrosPaginados(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data) => {
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;

        // Array para almacenar las relaciones enriquecidas con datos de usuario y libro
        const relacionesEnriquecidas: UsuarioLibro[] = [];
        
        // Si no hay datos, asignamos el array vacío y terminamos
        if (!data.content || data.content.length === 0) {
          this.usuarioLibros = relacionesEnriquecidas;
          return;
        }
        
        // Definimos la interfaz para los resultados combinados
        interface ResultadoCombinado {
          relacion: UsuarioLibro;
          usuario: Usuario;
          libro: Libro;
        }
        
        // Para cada relación, obtenemos los datos de usuario y libro
        const observables: Observable<ResultadoCombinado>[] = data.content.map((relacion: UsuarioLibro) => {
          const usuarioObs = this.usuarioService.getUsuarioById(relacion.usuarioId).pipe(
            catchError(() => {
              // Si hay error al cargar el usuario, devolvemos un objeto con info básica
              return of({ id: relacion.usuarioId, nombre: 'Usuario desconocido', apellido: '' } as Usuario);
            })
          );
          
          const libroObs = this.libroService.getLibroById(relacion.libroId).pipe(
            catchError(() => {
              // Si hay error al cargar el libro, devolvemos un objeto con info básica
              return of({ id: relacion.libroId, titulo: 'Libro desconocido' } as Libro);
            })
          );
          
          return forkJoin({
            relacion: of(relacion),
            usuario: usuarioObs,
            libro: libroObs
          }) as Observable<ResultadoCombinado>;
        });
        
        forkJoin(observables).subscribe({
          next: (resultados) => {
            this.usuarioLibros = resultados.map((resultado) => {
              return {
                ...resultado.relacion,
                usuarioNombre: `${resultado.usuario.nombre} ${resultado.usuario.apellido}`,
                libroTitulo: resultado.libro.titulo
              };
            });
          },
          error: (error) => {
            console.error('Error al enriquecer datos de usuario-libro', error);
            this.notificationService.error('Error', { 
              description: 'No se pudieron cargar todos los detalles de las relaciones'
            });
            // En caso de error, asignamos solo los datos básicos
            this.usuarioLibros = data.content;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar relaciones usuario-libro paginadas', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar las relaciones usuario-libro'
        });
      }
    });
  }

  /**
   * Cambia a la página especificada
   * @param page - Número de página (0-based)
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getUsuarioLibrosPaginados();
    }
  }

  /**
   * Cambia el ordenamiento de los datos
   * @param sortBy - Campo por el que ordenar
   */
  changeSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      // Si ya está ordenando por este campo, cambia la dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0; // Vuelve a la primera página
    this.getUsuarioLibrosPaginados();
  }

  /**
   * Cambia el tamaño de página
   * @param size - Nuevo tamaño de página
   */
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Vuelve a la primera página
    this.getUsuarioLibrosPaginados();
  }

  /**
   * Obtiene todas las relaciones usuario-libro del sistema
   * Método de respaldo que mantiene la compatibilidad con el código existente
   */
  getAllUsuarioLibros(): void {
    this.usuarioLibroService.getAllUsuarioLibros().subscribe({
      next: (data) => {
        this.usuarioLibros = data;
      },
      error: (error) => {
        console.error('Error al cargar relaciones usuario-libro', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar las relaciones usuario-libro'
        });
      }
    });
  }

  /**
   * Obtiene una relación específica por su ID
   * @param id - ID de la relación a buscar
   */
  getUsuarioLibroById(id: number): void {
    this.usuarioLibroService.getUsuarioLibroById(id).subscribe({
      next: (usuarioLibro) => {
        this.usuarioLibroDetalle = usuarioLibro;
      },
      error: (error) => {
        console.error('Error al obtener detalles de la relación usuario-libro', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los detalles de la relación'
        });
      }
    });
  }

  /**
   * Prepara el formulario para crear una nueva relación
   */
  prepareCreateUsuarioLibro(): void {
    this.isEditing = false;
    this.currentUsuarioLibro = this.initializeUsuarioLibro();
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar una relación existente
   * @param usuarioLibro - Relación a editar
   */
  prepareUpdateUsuarioLibro(usuarioLibro: UsuarioLibro): void {
    this.isEditing = true;
    this.currentUsuarioLibro = { ...usuarioLibro };
    this.showForm = true;
  }

  /**
   * Determina si debe crear o actualizar una relación
   */
  saveUsuarioLibro(): void {
    if (this.isEditing) {
      this.updateUsuarioLibro();
    } else {
      this.createUsuarioLibro();
    }
  }

  /**
   * Envía la petición para crear una nueva relación
   */
  createUsuarioLibro(): void {
    this.usuarioLibroService.createUsuarioLibro(this.currentUsuarioLibro).subscribe({
      next: (response) => {
        this.notificationService.success('Éxito', { 
          description: 'Relación usuario-libro creada correctamente'
        });
        this.getUsuarioLibrosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear relación usuario-libro', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo crear la relación usuario-libro'
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar una relación existente
   */
  updateUsuarioLibro(): void {
    this.usuarioLibroService.updateUsuarioLibro(this.currentUsuarioLibro.id, this.currentUsuarioLibro).subscribe({
      next: (response) => {
        this.notificationService.success('Éxito', { 
          description: 'Relación usuario-libro actualizada correctamente'
        });
        this.getUsuarioLibrosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar relación usuario-libro', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo actualizar la relación usuario-libro'
        });
      }
    });
  }

  /**
   * Envía la petición para eliminar una relación
   * @param id - ID de la relación a eliminar
   */
  deleteUsuarioLibro(id: number): void {
    this.usuarioLibroIdToDelete = id;
    this.showConfirmModal = true;
  }
  
  /**
   * Confirma la eliminación de la relación usuario-libro
   */
  confirmDeleteUsuarioLibro(): void {
    if (this.usuarioLibroIdToDelete) {
      this.usuarioLibroService.deleteUsuarioLibro(this.usuarioLibroIdToDelete).subscribe({
        next: () => {
          this.notificationService.success('Eliminada', { 
            description: 'La relación usuario-libro ha sido eliminada'
          });
          this.getUsuarioLibrosPaginados();
          this.usuarioLibroIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar relación usuario-libro', error);
          this.notificationService.error('Error', { 
            description: 'No se pudo eliminar la relación usuario-libro'
          });
          this.usuarioLibroIdToDelete = null;
        }
      });
    }
  }
  
  /**
   * Cancela la eliminación de la relación usuario-libro
   */
  cancelDeleteUsuarioLibro(): void {
    this.usuarioLibroIdToDelete = null;
    console.log('Eliminación cancelada');
  }

  /**
   * Cancela la edición/creación de una relación
   */
  cancelEdit(): void {
    this.showForm = false;
    this.currentUsuarioLibro = this.initializeUsuarioLibro();
  }

  /**
   * Cierra el panel de detalles de la relación
   */
  closeDetails(): void {
    this.usuarioLibroDetalle = null;
  }

  /**
   * Formatea la fecha para mostrarla correctamente
   */
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  /**
   * Crea un objeto relación con valores por defecto
   */
  private initializeUsuarioLibro(): any {
    return {
      id: null,
      usuarioId: null,
      libroId: null,
      estadoLectura: 'LEYENDO', // Valores posibles: LEYENDO, TERMINADO, PENDIENTE, ABANDONADO
      valoracion: null,
      comentario: null,
      fechaInicioLectura: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      fechaFinLectura: null
    };
  }

  /**
   * Devuelve la fecha actual en formato ISO para usarla como valor máximo en inputs de tipo fecha
   */
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
