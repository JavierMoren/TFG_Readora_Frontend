import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuarioLibro } from '../../../models/usuario-libro/usuario-libro.model';
import { Libro } from '../../../models/libro/libro.model';
import { Autor } from '../../../models/autor/autor.model';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap, Observable } from 'rxjs';

@Component({
  selector: 'app-biblioteca-personal',
  imports: [CommonModule, FormsModule],
  templateUrl: './biblioteca-personal.component.html',
  styleUrls: ['./biblioteca-personal.component.css']
})
export class BibliotecaPersonalComponent implements OnInit {
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
  filtroActual: string = 'todos';
  
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

  // Indicador de carga
  cargando: boolean = false;

  constructor(
    private usuarioLibroService: UsuarioLibroService,
    private libroService: LibrosService,
    public storageService: StorageService,
    private authService: AutenticacionService,
    private notificationService: NotificationService
  ) {
      }

  ngOnInit(): void {
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
                    fechaFinLectura: usuarioLibro.fechaFinLectura
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
              if (this.filtroActual === 'todos' || this.filtroActual === 'leyendo') {
                
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
      fechaFinLectura: this.libroSeleccionado.fechaFinLectura
    };
    
    // Si cambia a TERMINADO y no tiene fecha de fin, establecerla a hoy
    if (usuarioLibroActualizado.estadoLectura === 'TERMINADO' && !usuarioLibroActualizado.fechaFinLectura) {
      usuarioLibroActualizado.fechaFinLectura = new Date().toISOString().split('T')[0];
    }
    
    this.usuarioLibroService.updateUsuarioLibro(
      this.libroSeleccionado.usuarioLibroId, 
      usuarioLibroActualizado
    ).subscribe({
      next: () => {
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
   * Cambia el filtro de visualización de libros y maneja la accesibilidad
   */
  cambiarFiltro(filtro: string, event?: KeyboardEvent): void {
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
  estrellasPorValoracion(valoracion: number | null): number[] {
    return valoracion ? Array(valoracion).fill(0) : [];
  }
  
  /**
   * Obtiene el color de fondo según el estado del libro
   */
  getColorEstado(estado: string): string {
    switch(estado) {
      case 'LEYENDO': return 'bg-primary';
      case 'PENDIENTE': return 'bg-warning text-dark';
      case 'TERMINADO': return 'bg-success';
      case 'ABANDONADO': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }
  
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
   * Trunca un texto largo para mostrar una versión corta
   */
  truncarTexto(texto: string | null, longitud: number = 100): string {
    if (!texto) return '';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
  }
}
