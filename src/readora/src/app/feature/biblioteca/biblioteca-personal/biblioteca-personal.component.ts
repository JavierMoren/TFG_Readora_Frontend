import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Libro } from '../../../models/libro/libro.model';
import { forkJoin, map, switchMap, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-biblioteca-personal',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './biblioteca-personal.component.html',
  styleUrls: ['./biblioteca-personal.component.css']
})
export class BibliotecaPersonalComponent implements OnInit, OnDestroy {
  // Colecciones de libros por estado
  librosLeyendo: any[] = [];
  librosPendientes: any[] = [];
  librosTerminados: any[] = [];
  librosAbandonados: any[] = [];
  
  // Libro seleccionado para edición
  libroSeleccionado: any = null;
  mostrarEdicion: boolean = false;
  
  // Usuario actual
  usuarioId: number | null = null;
  
  // Filtro de visualización
  filtroActual: string = 'leyendo';
  
  // Variables para la funcionalidad de búsqueda
  terminoBusqueda: string = '';
  mostrandoResultados: boolean = false;
  resultadosBusqueda: any[] = [];
  cargandoBusqueda: boolean = false;
  
  // Variables para el debounce de la búsqueda
  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Estados de lectura disponibles
  estadosLectura = [
    { valor: 'LEYENDO', etiqueta: 'Leyendo actualmente' },
    { valor: 'PENDIENTE', etiqueta: 'Por leer' },
    { valor: 'TERMINADO', etiqueta: 'Leído' },
    { valor: 'ABANDONADO', etiqueta: 'Abandonado' }
  ];
  
  // Rutas para imágenes predeterminadas
  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  // Fecha actual para validaciones
  fechaActual: string = new Date().toISOString().split('T')[0];

  // Indicador de carga
  cargando: boolean = false;

  constructor(
    private usuarioLibroService: UsuarioLibroService,
    private libroService: LibrosService,
    public storageService: StorageService,
    private authService: AutenticacionService,
    private notificationService: NotificationService,
    private router: Router
  ) {
      }

  ngOnInit(): void {
    // Configurar el debounce para la búsqueda
    this.searchTerms.pipe(
      takeUntil(this.destroy$),
      debounceTime(300), // Esperar 300ms después de cada pulsación de tecla
      distinctUntilChanged()
    ).subscribe(term => {
      if (!term || term.trim().length === 0) {
        this.limpiarBusqueda();
      } else {
        this.buscarLibros();
      }
    });

    // Obtener el ID del usuario autenticado
    this.authService.getUserInfo().subscribe({
      next: (userData) => {
        if (userData && userData.id) {
          this.usuarioId = userData.id;
          this.cargarLibrosUsuario();
        } else {
          this.notificationService.error('Error', {
            description: 'No se pudo obtener tu información de usuario'
          });
        }
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error de autenticación', error);
        this.notificationService.error('Error de autenticación', {
          description: 'No se pudo verificar tu sesión. Por favor, intenta iniciar sesión nuevamente.'
        });
      }
    });
  }

  /**
   * Carga todos los libros del usuario y los organiza por estado de lectura
   */
  cargarLibrosUsuario(): void {
    if (!this.usuarioId) {
      console.error('[BibliotecaPersonal] No hay ID de usuario disponible');
      return;
    }
    
    // Establecer estado de carga
    this.cargando = true;
    
    // Obtener todas las relaciones usuario-libro
    this.usuarioLibroService.getLibrosByUsuarioId(this.usuarioId).subscribe({
      next: (usuarioLibros) => {
        if (!usuarioLibros || usuarioLibros.length === 0) {
          this.cargando = false; // Soluciona el loading infinito si no hay libros
          this.notificationService.info('Biblioteca vacía', {
            description: 'No tienes libros en tu biblioteca personal. ¡Comienza agregando algunos!'
          });
          return;
        }
        
        // Reset de las listas
        this.librosLeyendo = [];
        this.librosPendientes = [];
        this.librosTerminados = [];
        this.librosAbandonados = [];
        
        // Crear un array de observables para obtener detalles de cada libro
        const observables = usuarioLibros.map(usuarioLibro => {
          // Primero obtenemos los detalles del libro
          return this.libroService.getLibroById(usuarioLibro.libroId).pipe(
            // Luego obtenemos los autores para el libro
            switchMap((libro: Libro) => {
              
              // Obtenemos los autores del libro
              return this.libroService.getAutoresByLibroId(libro.id).pipe(
                map(autores => {
                  
                  // Combinamos toda la información
                  return {
                    id: libro.id,
                    titulo: libro.titulo,
                    isbn: libro.isbn,
                    editorial: libro.editorial,
                    anioPublicacion: libro.anioPublicacion,
                    genero: libro.genero,
                    sinopsis: libro.sinopsis,
                    portadaUrl: libro.portadaUrl,
                    numeroPaginas: libro.numeroPaginas,
                    // Añadimos el autor (tomamos el primero) y la lista completa de autores
                    autor: autores.length > 0 ? autores[0] : null,
                    autores: autores,
                    // Añadimos las propiedades de la relación usuario-libro
                    usuarioLibroId: usuarioLibro.id,
                    estadoLectura: usuarioLibro.estadoLectura,
                    valoracion: usuarioLibro.valoracion,
                    comentario: usuarioLibro.comentario,
                    fechaInicioLectura: usuarioLibro.fechaInicioLectura,
                    fechaFinLectura: usuarioLibro.fechaFinLectura,
                    paginasLeidas: usuarioLibro.paginasLeidas
                  };
                })
              );
            })
          );
        });
        
        // Ejecutar todas las peticiones en paralelo
        forkJoin(observables).subscribe({
          next: (librosConEstado) => {
            // Clasificar los libros según su estado
            librosConEstado.forEach(libro => {
              
              // Validación específica para el estado LEYENDO con comprobación de case-sensitivity
              if (libro.estadoLectura && (libro.estadoLectura.toUpperCase() === 'LEYENDO')) {
                
                // Normaliza el estado para garantizar que sea 'LEYENDO' en mayúsculas
                libro.estadoLectura = 'LEYENDO';
                
                // Verifica si el libro ya existe en el array (para evitar duplicados)
                const yaExiste = this.librosLeyendo.some(l => l.id === libro.id);
              }
              
              switch(libro.estadoLectura ? libro.estadoLectura.toUpperCase() : '') {
                case 'LEYENDO':
                  this.librosLeyendo.push({...libro, estadoLectura: 'LEYENDO'});
                  break;
                case 'PENDIENTE':
                  this.librosPendientes.push(libro);
                  break;
                case 'TERMINADO':
                  this.librosTerminados.push(libro);
                  break;
                case 'ABANDONADO':
                  this.librosAbandonados.push(libro);
                  break;
                default:
                  // Estado de lectura desconocido
              }
            });
            
            // Clasificación completada
            
            // Depuración detallada para los arrays de libros
            if (this.librosLeyendo.length > 0) {
              
              // Verificar si necesitamos mostrar la sección "Leyendo"
              if (this.filtroActual === 'leyendo') {
                
                // Forzar actualización de la vista cuando hay libros en estado "Leyendo"
                setTimeout(() => {
                  // Actualizar vista
                }, 100);
              }
            }
            
            // Finalizar estado de carga
            this.cargando = false;
          },
          error: (error) => {
            console.error('[BibliotecaPersonal] Error al obtener detalles de los libros', error);
            this.notificationService.error('Error', {
              description: 'No se pudieron cargar todos los detalles de tus libros'
            });
            this.cargando = false;
          }
        });
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error al cargar la biblioteca personal', error);
        this.notificationService.error('Error', {
          description: 'No se pudo cargar tu biblioteca personal'
        });
        this.cargando = false;
      }
    });
  }

  /**
   * Actualiza el estado de lectura de un libro
   */
  actualizarEstadoLectura(): void {
    if (!this.libroSeleccionado || !this.usuarioId) {
      return;
    }
    
    const usuarioLibroActualizado = {
      id: this.libroSeleccionado.usuarioLibroId,
      usuarioId: this.usuarioId,
      libroId: this.libroSeleccionado.id,
      estadoLectura: this.libroSeleccionado.estadoLectura,
      valoracion: this.libroSeleccionado.valoracion,
      comentario: this.libroSeleccionado.comentario,
      fechaInicioLectura: this.libroSeleccionado.fechaInicioLectura,
      fechaFinLectura: this.libroSeleccionado.fechaFinLectura,
      paginasLeidas: this.libroSeleccionado.paginasLeidas
    };
    
    // Si cambia a TERMINADO
    if (usuarioLibroActualizado.estadoLectura === 'TERMINADO') {
      // Establecer la fecha de fin a hoy si no existe
      usuarioLibroActualizado.fechaFinLectura ??= new Date().toISOString().split('T')[0];
      
      // Si no hay fecha de inicio pero sí fecha de fin, establecer fecha de inicio igual a fecha de fin
      if (!usuarioLibroActualizado.fechaInicioLectura && usuarioLibroActualizado.fechaFinLectura) {
        usuarioLibroActualizado.fechaInicioLectura = usuarioLibroActualizado.fechaFinLectura;
      }
      
      // Si no ha leído todas las páginas, mostrar confirmación
      if (this.libroSeleccionado.paginasLeidas !== this.libroSeleccionado.numeroPaginas && 
          this.libroSeleccionado.numeroPaginas > 0) {
        this.notificationService.confirm({
          title: '¿Marcar como leído todo el libro?',
          text: '¿Quieres establecer el progreso de lectura al 100%?',
          icon: 'warning',
          confirmButtonText: 'Sí, completar',
          cancelButtonText: 'No, mantener progreso actual'
        }).then(result => {
          if (result) {
            // Si confirma, establecer páginas leídas al total

            usuarioLibroActualizado.paginasLeidas = this.libroSeleccionado.numeroPaginas;
          }
          this.ejecutarActualizacionLibro(usuarioLibroActualizado);
        });
        return;
      }
      
      // Si está marcando como TERMINADO y no entró en la confirmación (porque ya tenía todas las páginas leídas),
      // mantenemos el valor actual de páginas leídas y solo actualizamos si realmente hay una diferencia
      if (this.libroSeleccionado.numeroPaginas > 0 && 
          this.libroSeleccionado.paginasLeidas !== this.libroSeleccionado.numeroPaginas) {
        usuarioLibroActualizado.paginasLeidas = this.libroSeleccionado.numeroPaginas;
      }
    }
    
    // Para otros estados, actualizar directamente
    this.ejecutarActualizacionLibro(usuarioLibroActualizado);
  }

  /**
   * Ejecuta la actualización del libro con el servicio
   */
  private ejecutarActualizacionLibro(usuarioLibroActualizado: any): void {
    // Aseguramos que paginasLeidas sea un número válido
    usuarioLibroActualizado.paginasLeidas ??= 0;
    
    // Eliminamos la lógica que sobreescribía la elección del usuario
    // para respetar si decidió NO completar las páginas al marcar como terminado
    

    
    this.usuarioLibroService.updateUsuarioLibro(
      this.libroSeleccionado.usuarioLibroId, 
      usuarioLibroActualizado
    ).subscribe({
      next: (response) => {

        this.notificationService.success('Estado actualizado', {
          description: 'El estado del libro se ha actualizado correctamente'
        });
        this.cerrarEdicion();
        this.cargarLibrosUsuario();
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error al actualizar estado del libro', error);
        this.notificationService.error('Error', {
          description: 'No se pudo actualizar el estado del libro'
        });
      }
    });
  }

  /**
   * Prepara la edición de un libro
   */
  editarLibro(libro: any): void {
    this.libroSeleccionado = { ...libro };
    this.mostrarEdicion = true;
  }

  /**
   * Cierra el panel de edición
   */
  cerrarEdicion(): void {
    this.libroSeleccionado = null;
    this.mostrarEdicion = false;
  }

  /**
   * Elimina un libro de la biblioteca personal
   */
  eliminarDeColeccion(libro: any): void {
    this.notificationService.confirm({
      title: '¿Eliminar libro?',
      text: '¿Estás seguro de eliminar este libro de tu biblioteca?',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (resultado) {
        
        // Eliminar inmediatamente de la lista local para actualizar la UI
        this.eliminarLibroDeListas(libro);
        
        this.usuarioLibroService.deleteUsuarioLibro(libro.usuarioLibroId).subscribe({
          next: () => {
            this.notificationService.success('Libro eliminado', {
              description: 'El libro ha sido eliminado de tu biblioteca'
            });
            // También recargamos los datos para asegurar sincronización completa
            this.cargarLibrosUsuario();
          },
          error: (error) => {
            console.error('[BibliotecaPersonal] Error al eliminar libro de la biblioteca', error);
            this.notificationService.error('Error', {
              description: 'No se pudo eliminar el libro de tu biblioteca'
            });
            // Si hay un error, recargamos para restaurar el estado original
            this.cargarLibrosUsuario();
          }
        });
      }
    });
  }
  
  /**
   * Elimina un libro de todas las listas locales
   */
  eliminarLibroDeListas(libro: any): void {
    // Eliminar de la lista correspondiente según su estado
    switch(libro.estadoLectura) {
      case 'LEYENDO':
        this.librosLeyendo = this.librosLeyendo.filter(l => l.usuarioLibroId !== libro.usuarioLibroId);
        break;
      case 'PENDIENTE':
        this.librosPendientes = this.librosPendientes.filter(l => l.usuarioLibroId !== libro.usuarioLibroId);
        break;
      case 'TERMINADO':
        this.librosTerminados = this.librosTerminados.filter(l => l.usuarioLibroId !== libro.usuarioLibroId);
        break;
      case 'ABANDONADO':
        this.librosAbandonados = this.librosAbandonados.filter(l => l.usuarioLibroId !== libro.usuarioLibroId);
        break;
    }
  }

  /**
   * Realiza la búsqueda de libros por título dentro del estado de la pestaña activa
   */
  buscarLibros(): void {
    if (!this.usuarioId || !this.terminoBusqueda.trim()) {
      this.limpiarBusqueda();
      return;
    }

    // Mapear el filtro actual al estado de lectura
    const estadoMap: { [key: string]: string } = {
      'leyendo': 'LEYENDO',
      'pendientes': 'PENDIENTE', 
      'terminados': 'TERMINADO',
      'abandonados': 'ABANDONADO'
    };

    const estadoLectura = estadoMap[this.filtroActual];
    if (!estadoLectura) {
      return;
    }

    this.cargandoBusqueda = true;
    this.mostrandoResultados = true;
    
    // Anunciar para lectores de pantalla
    this.anunciarParaLectoresDePantalla('Buscando libros...');

    this.usuarioLibroService.buscarLibrosPorEstadoYTitulo(
      this.usuarioId, 
      estadoLectura, 
      this.terminoBusqueda.trim()
    ).subscribe({
      next: (usuarioLibros) => {
        if (!usuarioLibros || usuarioLibros.length === 0) {
          this.resultadosBusqueda = [];
          this.cargandoBusqueda = false;
          
          // Anunciar que no se encontraron resultados
          this.anunciarParaLectoresDePantalla('No se encontraron libros que coincidan con la búsqueda.');
          return;
        }

        // Procesar los resultados igual que en cargarLibrosUsuario()
        const observables = usuarioLibros.map(usuarioLibro => {
          return this.libroService.getLibroById(usuarioLibro.libroId).pipe(
            switchMap((libro: any) => {
              return this.libroService.getAutoresByLibroId(libro.id).pipe(
                map(autores => ({
                  id: libro.id,
                  titulo: libro.titulo,
                  isbn: libro.isbn,
                  editorial: libro.editorial,
                  anioPublicacion: libro.anioPublicacion,
                  genero: libro.genero,
                  sinopsis: libro.sinopsis,
                  portadaUrl: libro.portadaUrl,
                  numeroPaginas: libro.numeroPaginas,
                  autor: autores.length > 0 ? autores[0] : null,
                  autores: autores,
                  usuarioLibroId: usuarioLibro.id,
                  estadoLectura: usuarioLibro.estadoLectura,
                  valoracion: usuarioLibro.valoracion,
                  comentario: usuarioLibro.comentario,
                  fechaInicioLectura: usuarioLibro.fechaInicioLectura,
                  fechaFinLectura: usuarioLibro.fechaFinLectura,
                  paginasLeidas: usuarioLibro.paginasLeidas
                }))
              );
            })
          );
        });

        forkJoin(observables).subscribe({
          next: (librosConEstado) => {
            this.resultadosBusqueda = librosConEstado;
            this.cargandoBusqueda = false;
            
            // Anunciar resultados encontrados
            const mensaje = `Se encontraron ${librosConEstado.length} ${librosConEstado.length === 1 ? 'libro' : 'libros'}.`;
            this.anunciarParaLectoresDePantalla(mensaje);
          },
          error: (error) => {
            console.error('[BibliotecaPersonal] Error al obtener detalles de los libros de búsqueda', error);
            this.notificationService.error('Error', {
              description: 'No se pudieron cargar todos los detalles de los libros encontrados'
            });
            this.cargandoBusqueda = false;
          }
        });
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error en la búsqueda', error);
        this.notificationService.error('Error', {
          description: 'No se pudo realizar la búsqueda'
        });
        this.cargandoBusqueda = false;
      }
    });
  }

  /**
   * Limpia los resultados de búsqueda y vuelve a mostrar todos los libros
   * @param mantenerFoco Si es verdadero, la función no intenta volver a enfocar el buscador
   */
  limpiarBusqueda(mantenerFoco: boolean = false): void {
    this.terminoBusqueda = '';
    this.mostrandoResultados = false;
    this.resultadosBusqueda = [];
    this.cargandoBusqueda = false;
    
    // Anuncio para lectores de pantalla
    this.anunciarParaLectoresDePantalla('Búsqueda limpiada. Mostrando todos los libros.');
  }

  /**
   * Maneja el cambio en el término de búsqueda.
   * Limpia resultados si está vacío y realiza búsqueda inmediata si hay contenido
   * @deprecated Usar actualizarBusqueda en su lugar
   */
  onTerminoBusquedaChange(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim().length === 0) {
      this.limpiarBusqueda();
    } else if (this.terminoBusqueda.trim()) {
      // Búsqueda inmediata sin restricción de longitud mínima
      this.buscarLibros();
    }
  }
  
  /**
   * Actualiza el término de búsqueda y dispara el evento de debounce
   * para realizar la búsqueda con un retraso para evitar perder el foco
   */
  actualizarBusqueda(term: string): void {
    this.terminoBusqueda = term;
    this.searchTerms.next(term);
    
    // Notificar cambio de búsqueda para accesibilidad
    if (term.length === 0) {
      this.notificationService.info('Búsqueda limpiada', {
        description: 'Mostrando todos los libros de la sección actual'
      });
    }
  }

  /**
   * Obtiene la lista de libros a mostrar según el filtro y si hay búsqueda activa
   */
  getLibrosParaMostrar(): any[] {
    if (this.mostrandoResultados) {
      return this.resultadosBusqueda;
    }

    switch (this.filtroActual) {
      case 'leyendo':
        return this.librosLeyendo;
      case 'pendientes':
        return this.librosPendientes;
      case 'terminados':
        return this.librosTerminados;
      case 'abandonados':
        return this.librosAbandonados;
      default:
        return [];
    }
  }

  /**
   * Obtiene el título de la sección actual
   */
  getTituloSeccion(): string {
    if (this.mostrandoResultados) {
      return `Resultados de búsqueda: "${this.terminoBusqueda}"`;
    }

    switch (this.filtroActual) {
      case 'leyendo':
        return 'Estoy leyendo';
      case 'pendientes':
        return 'Pendientes por leer';
      case 'terminados':
        return 'Leídos';
      case 'abandonados':
        return 'Abandonados';
      default:
        return '';
    }
  }

  /**
   * Cambia el filtro de visualización de libros y maneja la accesibilidad
   */
  cambiarFiltro(filtro: string, event?: KeyboardEvent): void {
    // Si hay una búsqueda activa, limpiarla al cambiar de pestaña
    if (this.mostrandoResultados) {
      this.limpiarBusqueda();
    }
    
    this.filtroActual = filtro;
    
    // Si el evento existe y es un evento de teclado, mover el foco al panel correspondiente
    if (event) {
      const tabpanel = document.getElementById('seccion-' + filtro);
      if (tabpanel) {
        tabpanel.focus();
      }
    }
    
    // Anunciar para lectores de pantalla que ha cambiado la pestaña
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('class', 'visually-hidden');
    liveRegion.textContent = `Mostrando sección: ${filtro}`;
    document.body.appendChild(liveRegion);
    
    // Eliminar después de anunciar
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }

  /**
   * Obtiene la URL completa de la imagen con placeholder si no existe
   */
  getImageUrl(imagen: string | null): string {
    if (!imagen) {
      return this.libroPlaceholder;
    }
    return this.storageService.getFullImageUrl(imagen);
  }
  
  /**
   * Obtiene la URL de imagen de autor con placeholder si no existe
   */
  getAutorImageUrl(imagen: string | null): string {
    if (!imagen) {
      return this.autorPlaceholder;
    }
    return this.storageService.getFullImageUrl(imagen);
  }

  /**
   * Formatea la fecha para mostrarla correctamente
   */
  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString();
  }

  /**
   * Genera un array para mostrar estrellas de valoración
   */
  /**
   * Obtiene la etiqueta para mostrar según el estado del libro
   */
  getEtiquetaEstado(estado: string): string {
    switch(estado) {
      case 'LEYENDO': return 'Leyendo';
      case 'PENDIENTE': return 'Por leer';
      case 'TERMINADO': return 'Leído';
      case 'ABANDONADO': return 'Abandonado';
      default: return estado;
    }
  }
  
  /**
   * Calcula el porcentaje de progreso de lectura basado en páginas leídas y total
   */
  calcularProgreso(paginasLeidas: number | null | undefined, totalPaginas: number | null | undefined): number {
    if (!paginasLeidas || !totalPaginas || paginasLeidas <= 0 || totalPaginas <= 0) {
      return 0;
    }
    
    // Asegurar que el porcentaje no exceda el 100%
    return Math.min(Math.round((paginasLeidas / totalPaginas) * 100), 100);
  }
  
  /**
   * Trunca un texto largo para mostrar una versión corta
   */
  truncarTexto(texto: string | null, longitud: number = 100): string {
    if (!texto) return '';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
  }

  /**
   * Actualiza el progreso cuando se mueve la barra interactiva
   */
  actualizarProgresoBarra(): void {
    // Asegurar que no se exceda el máximo de páginas
    if (this.libroSeleccionado && this.libroSeleccionado.paginasLeidas > this.libroSeleccionado.numeroPaginas) {
      this.libroSeleccionado.paginasLeidas = this.libroSeleccionado.numeroPaginas;
    }
  }

  /**
   * Valida si el formulario está listo para enviarse
   */
  formularioValido(): boolean {
    if (!this.libroSeleccionado) return false;

    // Para libros ya terminados sin fecha de inicio, ser más permisivo
    // Solo requerir fecha de inicio si el usuario está activamente editando las fechas
    if (this.libroSeleccionado.fechaFinLectura && !this.libroSeleccionado.fechaInicioLectura) {
      // Si el libro está terminado y no tiene fecha de inicio, automáticamente asignar la fecha de fin como inicio
      if (this.libroSeleccionado.estadoLectura === 'TERMINADO') {
        this.libroSeleccionado.fechaInicioLectura = this.libroSeleccionado.fechaFinLectura;
      } else {
        // Para otros estados, requerir fecha de inicio si hay fecha de fin
        return false;
      }
    }
    
    // Si hay fecha de inicio, validar que no sea futura
    if (this.libroSeleccionado.fechaInicioLectura) {
      const fechaInicio = new Date(this.libroSeleccionado.fechaInicioLectura);
      const hoy = new Date();
      if (fechaInicio > hoy) return false;
      
      // Si hay fecha de fin, verificar que es posterior a la de inicio
      if (this.libroSeleccionado.fechaFinLectura) {
        const fechaFin = new Date(this.libroSeleccionado.fechaFinLectura);
        if (fechaFin < fechaInicio || fechaFin > hoy) return false;
      }
    }
    
    // La fecha de fin ya no es obligatoria para TERMINADO o ABANDONADO
    
    // Validar páginas leídas (solo si se han especificado)
    if (this.libroSeleccionado.numeroPaginas && 
        this.libroSeleccionado.paginasLeidas !== undefined && 
        this.libroSeleccionado.paginasLeidas !== null) {
      
      if (this.libroSeleccionado.paginasLeidas < 0 || 
          this.libroSeleccionado.paginasLeidas > this.libroSeleccionado.numeroPaginas) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Muestra confirmación antes de actualizar
   */
  confirmarActualizacion(): void {
    if (!this.formularioValido()) {
      this.notificationService.warning('Datos incorrectos', {
        description: 'Por favor, revisa los errores en el formulario antes de guardar'
      });
      return;
    }
    
    this.notificationService.confirm({
      title: '¿Guardar cambios?',
      text: '¿Estás seguro de guardar los cambios realizados a este libro?',
      icon: 'question',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result) {
        this.actualizarEstadoLectura();
      }
    });
  }
  
  /**
   * Devuelve un mensaje indicando los errores de validación en el formulario
   */
  getMensajeErrorValidacion(): string {
    if (!this.libroSeleccionado) return 'Falta información del libro';
    
    let errores = [];
    
    // Validar fecha de inicio si hay fecha de fin (excepto para libros ya terminados)
    if (this.libroSeleccionado.fechaFinLectura && !this.libroSeleccionado.fechaInicioLectura) {
      // Para libros terminados, auto-corregir la fecha de inicio
      if (this.libroSeleccionado.estadoLectura === 'TERMINADO') {
        this.libroSeleccionado.fechaInicioLectura = this.libroSeleccionado.fechaFinLectura;
      } else {
        errores.push('Si indicas fecha de fin, también debes indicar fecha de inicio');
      }
    }
    
    // Validar fechas futuras
    if (this.libroSeleccionado.fechaInicioLectura) {
      const fechaInicio = new Date(this.libroSeleccionado.fechaInicioLectura);
      const hoy = new Date();
      if (fechaInicio > hoy) errores.push('La fecha de inicio no puede ser futura');
      
      // Validar que fecha fin sea posterior a fecha inicio
      if (this.libroSeleccionado.fechaFinLectura) {
        const fechaFin = new Date(this.libroSeleccionado.fechaFinLectura);
        if (fechaFin < fechaInicio) errores.push('La fecha de fin debe ser posterior a la de inicio');
        if (fechaFin > hoy) errores.push('La fecha de fin no puede ser futura');
      }
    }
    
    // Validar páginas leídas
    if (this.libroSeleccionado.paginasLeidas !== undefined && this.libroSeleccionado.paginasLeidas !== null) {
      if (this.libroSeleccionado.paginasLeidas < 0) {
        errores.push('Las páginas leídas no pueden ser negativas');
      } else if (this.libroSeleccionado.numeroPaginas && 
                 this.libroSeleccionado.paginasLeidas > this.libroSeleccionado.numeroPaginas) {
        errores.push('Las páginas leídas no pueden superar el total de páginas');
      }
    }
    
    return errores.length > 0 ? 'Errores: ' + errores.join('. ') : 'Completa los campos requeridos';
  }

  /**
   * Navega a la vista de detalles del libro
   */
  irADetalleLibro(libro: any): void {
    if (libro && libro.id) {
      this.router.navigate(['/libros', libro.id]);
    }
  }

  /**
   * Navega a la vista de detalles del autor
   */
  irADetalleAutor(autor: any): void {
    if (autor && autor.id) {
      this.router.navigate(['/autores', autor.id]);
    }
  }

  /**
   * Verifica si hay errores de validación en el formulario
   */
  tieneErroresValidacion(): boolean {
    if (!this.libroSeleccionado) return false;
    
    // Verificar si hay fecha de fin pero no fecha de inicio (excepto para libros terminados)
    if (this.libroSeleccionado.fechaFinLectura && !this.libroSeleccionado.fechaInicioLectura) {
      // Para libros terminados, auto-corregir en lugar de mostrar error
      if (this.libroSeleccionado.estadoLectura === 'TERMINADO') {
        this.libroSeleccionado.fechaInicioLectura = this.libroSeleccionado.fechaFinLectura;
        return false; // No hay error después de auto-corregir
      }
      return true; // Hay error para otros estados
    }
    
    // Verificar si la fecha de inicio es posterior a la fecha actual
    if (this.libroSeleccionado.fechaInicioLectura && this.libroSeleccionado.fechaInicioLectura > this.fechaActual) {
      return true;
    }
    
    // Verificar si la fecha de fin es anterior a la fecha de inicio
    if (this.libroSeleccionado.fechaFinLectura && this.libroSeleccionado.fechaInicioLectura && 
        this.libroSeleccionado.fechaFinLectura < this.libroSeleccionado.fechaInicioLectura) {
      return true;
    }
    
    // Verificar si la fecha de fin es posterior a la fecha actual
    if (this.libroSeleccionado.fechaFinLectura && this.libroSeleccionado.fechaFinLectura > this.fechaActual) {
      return true;
    }
    
    // Verificar páginas leídas
    if (this.libroSeleccionado.paginasLeidas !== null && this.libroSeleccionado.paginasLeidas !== undefined) {
      if (this.libroSeleccionado.paginasLeidas < 0 || 
          (this.libroSeleccionado.numeroPaginas && this.libroSeleccionado.paginasLeidas > this.libroSeleccionado.numeroPaginas)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Limpia los recursos al destruir el componente
   */
  ngOnDestroy(): void {
    // Notificar a los observables que se complete la suscripción
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja los cambios en la fecha de inicio de lectura
   */
  onFechaInicioChange(): void {
    if (this.libroSeleccionado?.fechaInicioLectura && this.libroSeleccionado?.fechaFinLectura) {
      // Validar que la fecha de inicio no sea posterior a la fecha de fin
      if (new Date(this.libroSeleccionado.fechaInicioLectura) > new Date(this.libroSeleccionado.fechaFinLectura)) {
        // Limpiar la fecha de fin si es anterior a la de inicio
        this.libroSeleccionado.fechaFinLectura = '';
      }
    }
  }

  /**
   * Maneja los cambios en la fecha de fin de lectura
   */
  onFechaFinChange(): void {
    if (this.libroSeleccionado?.fechaFinLectura && !this.libroSeleccionado?.fechaInicioLectura) {
      // Si hay fecha de fin pero no de inicio, establecer la fecha de inicio como la misma fecha de fin
      this.libroSeleccionado.fechaInicioLectura = this.libroSeleccionado.fechaFinLectura;
    }
  }

  /**
   * Maneja el cambio en el estado de lectura y aplica validaciones reactivas
   */
  onEstadoLecturaChange(): void {
    if (!this.libroSeleccionado) return;
    
    const estado = this.libroSeleccionado.estadoLectura;
    
    // Auto-establecer fechas según el nuevo estado
    switch (estado) {
      case 'LEYENDO':
        // Si no tiene fecha de inicio, establecer hoy
        this.libroSeleccionado.fechaInicioLectura ??= new Date().toISOString().split('T')[0];
        // Limpiar fecha de fin si existe (porque aún está leyendo)
        this.libroSeleccionado.fechaFinLectura = null;
        break;
        
      case 'TERMINADO':
        // Si no tiene fecha de inicio, establecer hoy
        this.libroSeleccionado.fechaInicioLectura ??= new Date().toISOString().split('T')[0];
        // Si no tiene fecha de fin, establecer hoy
        this.libroSeleccionado.fechaFinLectura ??= new Date().toISOString().split('T')[0];
        // Auto-completar páginas si no están completas
        if (this.libroSeleccionado.numeroPaginas && 
            (!this.libroSeleccionado.paginasLeidas || 
             this.libroSeleccionado.paginasLeidas < this.libroSeleccionado.numeroPaginas)) {
          this.libroSeleccionado.paginasLeidas = this.libroSeleccionado.numeroPaginas;
        }
        break;
        
      case 'PENDIENTE':
        // Para libros pendientes, limpiar todas las fechas
        this.libroSeleccionado.fechaInicioLectura = null;
        this.libroSeleccionado.fechaFinLectura = null;
        // Resetear páginas leídas
        this.libroSeleccionado.paginasLeidas = 0;
        break;
        
      case 'ABANDONADO':
        // Para libros abandonados, mantener fecha de inicio si existe pero limpiar fecha de fin
        this.libroSeleccionado.fechaFinLectura = null;
        // No cambiar páginas leídas - el usuario puede haber leído algo antes de abandonar
        break;
    }
    
    // Forzar la actualización de validaciones en el próximo ciclo de detección de cambios
    // Esto hace que las validaciones se muestren inmediatamente sin esperar a que el usuario toque los campos
    setTimeout(() => {
      this.marcarCamposComoTocados();
    }, 0);
  }

  /**
   * Marca los campos del formulario como tocados para que se muestren las validaciones inmediatamente
   */
  private marcarCamposComoTocados(): void {
    // Simular que el usuario ha tocado los campos relevantes
    const fechaInicioEl = document.getElementById('fechaInicioLectura') as HTMLInputElement;
    const fechaFinEl = document.getElementById('fechaFinLectura') as HTMLInputElement;
    
    if (fechaInicioEl) {
      fechaInicioEl.dispatchEvent(new Event('blur'));
    }
    if (fechaFinEl) {
      fechaFinEl.dispatchEvent(new Event('blur'));
    }
  }

  /**
   * Determina si un campo es requerido basado en el estado actual del libro
   * Esto permite mostrar validaciones reactivas inmediatamente al cambiar el estado
   */
  esCampoRequerido(campo: string): boolean {
    if (!this.libroSeleccionado) return false;
    
    const estado = this.libroSeleccionado.estadoLectura;
    
    switch (campo) {
      case 'fechaInicio':
        return estado === 'LEYENDO' || estado === 'TERMINADO';
      case 'fechaFin':
        return estado === 'TERMINADO';
      default:
        return false;
    }
  }

  /**
   * Anuncia mensajes para lectores de pantalla mediante una región live
   */
  private anunciarParaLectoresDePantalla(mensaje: string): void {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('class', 'visually-hidden');
    liveRegion.textContent = mensaje;
    document.body.appendChild(liveRegion);
    
    // Eliminar después de anunciar
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  }
}