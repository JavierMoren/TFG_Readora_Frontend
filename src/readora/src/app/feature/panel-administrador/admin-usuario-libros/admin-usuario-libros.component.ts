import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioLibro } from '../../../models/usuario-libro/usuario-libro.model';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { LibrosService } from '../../../core/services/libros.service';
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
  
  // ID de la relación a eliminar
  usuarioLibroIdToDelete: number | null = null;

  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  Math = Math;

  // La función getPagesArray() se ha eliminado ya que ahora usamos una paginación simplificada

  // Filtros para búsqueda 
  filtroUsuarioId: number | null = null;
  filtroLibroId: number | null = null;
  tipoBusqueda: 'usuario' | 'libro' = 'usuario';
  
  // Detalle del libro seleccionado
  detalleLibro: any = null;

  constructor(
    private usuarioLibroService: UsuarioLibroService,
    private usuarioService: UsuarioService,
    private libroService: LibrosService,
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
                libroTitulo: resultado.libro.titulo,
                numeroPaginas: resultado.libro.numeroPaginas || null
              };
            });
          },
          error: (error) => {
            console.error('[AdminUsuarioLibros] Error al cargar detalles de las relaciones', error);
            this.notificationService.error('Error', { 
              description: 'No se pudieron cargar todos los detalles de las relaciones'
            });
            // En caso de error, asignamos solo los datos básicos
            this.usuarioLibros = data.content;
          }
        });
      },
      error: (error) => {
        console.error('[AdminUsuarioLibros] Error al cargar relaciones usuario-libro', error);
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
        console.error('[AdminUsuarioLibros] Error al obtener todas las relaciones usuario-libro', error);
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
        console.error(`[AdminUsuarioLibros] Error al obtener detalles de relación usuario-libro ID=${id}`, error);
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
    this.detalleLibro = null; // Reseteamos los detalles del libro
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
    
    // Cargar detalles del libro para mostrar información de páginas
    if (usuarioLibro.libroId) {
      this.cargarDetallesLibro(usuarioLibro.libroId);
    }
  }

  /**
   * Determina si debe crear o actualizar una relación
   */
  saveUsuarioLibro(): void {
    // Primero validamos el formulario
    if (!this.formularioValido()) {
      this.notificationService.warning('Datos incorrectos', {
        description: 'Por favor, revisa los datos del formulario antes de guardar.'
      });
      return;
    }
    
    // Si pasa la validación, procedemos con la creación o actualización
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
        console.error('[AdminUsuarioLibros] Error al crear relación usuario-libro', error);
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
    // Aseguramos que estamos enviando un objeto limpio, sin propiedades que pueden causar problemas en el backend
    const usuarioLibroToUpdate = {
      id: this.currentUsuarioLibro.id,
      usuarioId: this.currentUsuarioLibro.usuarioId,
      libroId: this.currentUsuarioLibro.libroId,
      estadoLectura: this.currentUsuarioLibro.estadoLectura,
      valoracion: this.currentUsuarioLibro.valoracion,
      comentario: this.currentUsuarioLibro.comentario,
      fechaInicioLectura: this.currentUsuarioLibro.fechaInicioLectura,
      fechaFinLectura: this.currentUsuarioLibro.fechaFinLectura,
      paginasLeidas: this.currentUsuarioLibro.paginasLeidas
    };
        
    this.usuarioLibroService.updateUsuarioLibro(this.currentUsuarioLibro.id, usuarioLibroToUpdate).subscribe({
      next: (response) => {
        this.notificationService.success('Éxito', { 
          description: 'Relación usuario-libro actualizada correctamente'
        });
        this.getUsuarioLibrosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        console.error(`[AdminUsuarioLibros] Error al actualizar relación usuario-libro ID=${this.currentUsuarioLibro.id}`, error);
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
  async deleteUsuarioLibro(id: number): Promise<void> {
    this.usuarioLibroIdToDelete = id;
    
    const confirmed = await this.notificationService.confirm({
      title: '¿Eliminar registro de lectura?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (confirmed) {
      this.confirmDeleteUsuarioLibro();
    } else {
      this.usuarioLibroIdToDelete = null;
    }
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
          console.error(`[AdminUsuarioLibros] Error al eliminar relación usuario-libro ID=${this.usuarioLibroIdToDelete}`, error);
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
      fechaFinLectura: null,
      paginasLeidas: 0 // Inicializamos a 0 para nuevos registros
    };
  }

  /**
   * Devuelve la fecha actual en formato ISO para usarla como valor máximo en inputs de tipo fecha
   */
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calcula el porcentaje de progreso de lectura
   */
  calcularProgreso(paginasLeidas: number | null | undefined, totalPaginas: number | null | undefined): number {
    if (!paginasLeidas || !totalPaginas || paginasLeidas <= 0 || totalPaginas <= 0) {
      return 0;
    }
    
    // Asegurar que el porcentaje no exceda el 100%
    return Math.min(Math.round((paginasLeidas / totalPaginas) * 100), 100);
  }

  /**
   * Carga los detalles del libro cuando se selecciona uno para edición
   */
  cargarDetallesLibro(libroId: number): void {
    if (!libroId) return;

    // Mostrar indicador de carga
    this.notificationService.info('Cargando', { 
      description: 'Obteniendo información del libro...'
    });

    this.libroService.getLibroById(libroId).subscribe({
      next: (libro) => {
        this.detalleLibro = libro;
        
        // Si tenemos el estado TERMINADO, actualizamos las páginas leídas
        if (this.currentUsuarioLibro.estadoLectura === 'TERMINADO' && this.detalleLibro?.numeroPaginas) {
          this.currentUsuarioLibro.paginasLeidas = this.detalleLibro.numeroPaginas;
        }
      },
      error: (error) => {
        console.error('[AdminUsuarioLibros] Error al cargar detalles del libro', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los detalles del libro'
        });
        // Aseguramos que el usuario pueda continuar aunque no se carguen los detalles
        this.detalleLibro = { numeroPaginas: null };
      }
    });
  }

  /**
   * Maneja el cambio de libro en el formulario
   */
  onLibroChange(): void {
    if (this.currentUsuarioLibro.libroId) {
      this.cargarDetallesLibro(this.currentUsuarioLibro.libroId);
    } else {
      this.detalleLibro = null;
    }
  }

  /**
   * Maneja los cambios en el estado de lectura
   * Actualiza automáticamente las páginas leídas si el estado cambia a TERMINADO
   */
  onEstadoLecturaChange(): void {
    // Si cambia a terminado
    if (this.currentUsuarioLibro.estadoLectura === 'TERMINADO') {
      // Preguntar si desea actualizar páginas leídas al total
      if (this.detalleLibro?.numeroPaginas) {
        // Solo preguntamos si el valor actual es diferente al total de páginas
        if (this.currentUsuarioLibro.paginasLeidas !== this.detalleLibro.numeroPaginas) {
          this.notificationService.confirm({
            title: 'Completar páginas',
            text: `¿Deseas actualizar automáticamente las páginas leídas al total (${this.detalleLibro.numeroPaginas})?`,
            confirmButtonText: 'Sí, actualizar',
            cancelButtonText: 'No, mantener valor actual'
          }).then(confirmed => {
            if (confirmed) {
              this.currentUsuarioLibro.paginasLeidas = this.detalleLibro.numeroPaginas;
            }
          });
        }
      }
      
      // Establecemos la fecha de finalización a hoy si no está establecida
      if (!this.currentUsuarioLibro.fechaFinLectura) {
        this.currentUsuarioLibro.fechaFinLectura = new Date().toISOString().split('T')[0];
      }
    } 
    // Si cambia a pendiente, preguntamos si desea reiniciar las páginas leídas
    else if (this.currentUsuarioLibro.estadoLectura === 'PENDIENTE' && this.currentUsuarioLibro.paginasLeidas > 0) {
      this.notificationService.confirm({
        title: 'Reiniciar progreso',
        text: '¿Deseas reiniciar el contador de páginas leídas a 0?',
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'No, mantener progreso'
      }).then(confirmed => {
        if (confirmed) {
          this.currentUsuarioLibro.paginasLeidas = 0;
        }
      });
    }
  }

  /**
   * Valida que todos los datos del formulario sean correctos
   * Añade validaciones adicionales que no pueden hacerse directamente en la plantilla
   */
  formularioValido(): boolean {
    if (!this.currentUsuarioLibro) return false;
    
    // Validar fechas
    if (this.currentUsuarioLibro.fechaInicioLectura && this.currentUsuarioLibro.fechaFinLectura) {
      const fechaInicio = new Date(this.currentUsuarioLibro.fechaInicioLectura);
      const fechaFin = new Date(this.currentUsuarioLibro.fechaFinLectura);
      
      // La fecha de fin debe ser posterior o igual a la de inicio
      if (fechaFin < fechaInicio) return false;
      
      // No validamos que la fecha sea futura o no, permitiendo fechas de finalización planificadas
    }
    
    // Validar páginas leídas para estados relevantes
    if (this.detalleLibro && this.detalleLibro.numeroPaginas) {
      // IMPORTANTE: Ya no modificamos automaticamente las páginas leídas aquí, solo validamos
      // Si las páginas leídas están definidas, deben estar en un rango válido
      if (this.currentUsuarioLibro.paginasLeidas !== undefined && 
          this.currentUsuarioLibro.paginasLeidas !== null) {
        if (this.currentUsuarioLibro.paginasLeidas < 0 || 
            (this.detalleLibro.numeroPaginas && this.currentUsuarioLibro.paginasLeidas > this.detalleLibro.numeroPaginas)) {
          return false;
        }
      }
    } else {
      // Si no hay detalles del libro, solo validamos que las páginas no sean negativas
      if (this.currentUsuarioLibro.paginasLeidas < 0) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Busca las lecturas de un usuario específico por su ID
   */
  buscarPorUsuarioId(): void {
    if (!this.filtroUsuarioId || this.filtroUsuarioId <= 0) {
      this.notificationService.warning('Atención', {
        description: 'Ingresa un ID de usuario válido'
      });
      return;
    }
    
    // Resetea la paginación al realizar una búsqueda
    this.currentPage = 0;
    
    // Usamos el método getLibrosByUsuarioId para obtener las lecturas del usuario
    this.usuarioLibroService.getLibrosByUsuarioId(this.filtroUsuarioId).subscribe({
      next: (data: UsuarioLibro[]) => {
        if (data && data.length > 0) {
          // Enriquecer los datos con información de libros
          const observables = data.map((relacion: UsuarioLibro) => {
            return this.libroService.getLibroById(relacion.libroId).pipe(
              map(libro => {
                return {
                  ...relacion,
                  libroTitulo: libro.titulo,
                  numeroPaginas: libro.numeroPaginas || null
                };
              }),
              catchError(() => {
                return of({
                  ...relacion,
                  libroTitulo: 'Libro desconocido',
                  numeroPaginas: null
                });
              })
            );
          });
          
          forkJoin(observables).subscribe({
            next: (resultados: any[]) => {
              // Cargar el nombre del usuario para todas las lecturas
              this.usuarioService.getUsuarioById(this.filtroUsuarioId!).subscribe({
                next: (usuario) => {
                  this.usuarioLibros = resultados.map((item: any) => {
                    return {
                      ...item,
                      usuarioNombre: `${usuario.nombre} ${usuario.apellido}`
                    };
                  });
                  
                  // Actualizamos el contador para mostrar el total correctamente
                  this.totalElements = resultados.length;
                  this.totalPages = 1; // Al filtrar no tenemos paginación
                  
                  this.notificationService.success('Búsqueda completada', {
                    description: `Se encontraron ${resultados.length} lecturas para el usuario #${this.filtroUsuarioId}`
                  });
                },
                error: () => {
                  // Si no podemos obtener el nombre del usuario, mostramos solo el ID
                  this.usuarioLibros = resultados.map((item: any) => {
                    return {
                      ...item,
                      usuarioNombre: `Usuario #${this.filtroUsuarioId}`
                    };
                  });
                  
                  // Actualizamos el contador
                  this.totalElements = resultados.length;
                  this.totalPages = 1;
                  
                  this.notificationService.success('Búsqueda completada', {
                    description: `Se encontraron ${resultados.length} lecturas para el usuario #${this.filtroUsuarioId}`
                  });
                }
              });
            },
            error: (error: any) => {
              console.error('[AdminUsuarioLibros] Error al enriquecer datos de lecturas', error);
              this.notificationService.error('Error', {
                description: 'No se pudieron cargar los detalles de las lecturas'
              });
            }
          });
        } else {
          // No hay resultados
          this.usuarioLibros = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.notificationService.info('Sin resultados', {
            description: `No se encontraron lecturas para el usuario con ID ${this.filtroUsuarioId}`
          });
        }
      },
      error: (error: any) => {
        console.error('[AdminUsuarioLibros] Error al buscar por ID de usuario', error);
        this.notificationService.error('Error', {
          description: 'Error al buscar lecturas por ID de usuario'
        });
      }
    });
  }
  
  /**
   * Limpia los filtros y vuelve a cargar todos los datos
   */
  limpiarFiltros(): void {
    this.filtroUsuarioId = null;
    this.filtroLibroId = null;
    this.currentPage = 0; // Volver a la primera página
    this.getUsuarioLibrosPaginados();
    this.notificationService.info('Filtros eliminados', {
      description: 'Mostrando todas las lecturas'
    });
  }

  /**
   * Busca las lecturas por un libro específico usando su ID
   */
  buscarPorLibroId(): void {
    if (!this.filtroLibroId || this.filtroLibroId <= 0) {
      this.notificationService.warning('Atención', {
        description: 'Ingresa un ID de libro válido'
      });
      return;
    }
    
    // Resetea la paginación al realizar una búsqueda
    this.currentPage = 0;
    
    // Usamos el método getUsuariosByLibroId para obtener las lecturas del libro
    this.usuarioLibroService.getUsuariosByLibroId(this.filtroLibroId).subscribe({
      next: (data: UsuarioLibro[]) => {
        // Si no hay resultados, mostrar mensaje
        if (data.length === 0) {
          this.usuarioLibros = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.notificationService.info('Sin resultados', {
            description: `No se encontraron lecturas para el libro con ID ${this.filtroLibroId}`
          });
          return;
        }
        
        // Procesar los datos de manera similar a como se hace en getUsuarioLibrosPaginados
        const relacionesEnriquecidas: UsuarioLibro[] = [];
        
        interface ResultadoCombinado {
          relacion: UsuarioLibro;
          usuario: Usuario;
          libro: Libro;
        }
        
        const observables: Observable<ResultadoCombinado>[] = data.map((relacion: UsuarioLibro) => {
          const usuarioObs = this.usuarioService.getUsuarioById(relacion.usuarioId).pipe(
            catchError(() => {
              return of({ id: relacion.usuarioId, nombre: 'Usuario desconocido', apellido: '' } as Usuario);
            })
          );
          
          const libroObs = this.libroService.getLibroById(relacion.libroId).pipe(
            catchError(() => {
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
                libroTitulo: resultado.libro.titulo,
                numeroPaginas: resultado.libro.numeroPaginas || null
              };
            });
            
            this.totalElements = this.usuarioLibros.length;
            this.totalPages = 1; // Al ser búsqueda específica, mostramos todo en una página
            
            this.notificationService.success('Búsqueda completada', {
              description: `Se encontraron ${this.usuarioLibros.length} lecturas para el libro con ID ${this.filtroLibroId}`
            });
          },
          error: (error) => {
            console.error('[AdminUsuarioLibros] Error al cargar detalles de las lecturas por libro', error);
            this.notificationService.error('Error', { 
              description: 'No se pudieron cargar todos los detalles de las lecturas'
            });
            this.usuarioLibros = data;
          }
        });
      },
      error: (error) => {
        console.error('[AdminUsuarioLibros] Error al buscar lecturas por libro', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar las lecturas para este libro'
        });
      }
    });
  }

  /**
   * Limpia el filtro de usuario y recarga todas las lecturas
   */
  limpiarFiltroUsuario(): void {
    this.filtroUsuarioId = null;
    this.currentPage = 0; // Volver a la primera página
    this.getUsuarioLibrosPaginados();
  }

  /**
   * Limpia el filtro de libro y recarga todas las lecturas
   */
  limpiarFiltroLibro(): void {
    this.filtroLibroId = null;
    this.currentPage = 0; // Volver a la primera página
    this.getUsuarioLibrosPaginados();
  }
}
