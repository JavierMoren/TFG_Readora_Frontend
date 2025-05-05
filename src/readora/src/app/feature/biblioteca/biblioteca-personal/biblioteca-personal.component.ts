import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { LibroService } from '../../../core/services/libro.service';
import { StorageService } from '../../../core/services/storage.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuarioLibro } from '../../../models/usuario-libro/usuario-libro.model';
import { Libro } from '../../../models/libro/libro.model';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-biblioteca-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
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

  constructor(
    private usuarioLibroService: UsuarioLibroService,
    private libroService: LibroService,
    private storageService: StorageService,
    private authService: AutenticacionService,
    private notificationService: NotificationService
  ) {
    console.log('[BibliotecaPersonal] Componente creado');
  }

  ngOnInit(): void {
    console.log('[BibliotecaPersonal] Inicializando componente');
    // Obtener el ID del usuario autenticado
    this.authService.getUserInfo().subscribe({
      next: (userData) => {
        if (userData && userData.id) {
          this.usuarioId = userData.id;
          console.log('[BibliotecaPersonal] ID de usuario obtenido:', userData.id);
          this.cargarLibrosUsuario();
        } else {
          console.error('[BibliotecaPersonal] No se pudo obtener el ID del usuario autenticado');
          this.notificationService.error('Error', {
            description: 'No se pudo obtener tu información de usuario'
          });
        }
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error al obtener información del usuario', error);
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
    console.log('[BibliotecaPersonal] Cargando libros del usuario');
    if (!this.usuarioId) {
      console.error('[BibliotecaPersonal] No hay ID de usuario disponible');
      return;
    }
    
    // Obtener todas las relaciones usuario-libro
    this.usuarioLibroService.getLibrosByUsuarioId(this.usuarioId).subscribe({
      next: (usuarioLibros) => {
        console.log('[BibliotecaPersonal] Relaciones usuario-libro obtenidas:', usuarioLibros ? usuarioLibros.length : 0);
        if (!usuarioLibros || usuarioLibros.length === 0) {
          console.log('[BibliotecaPersonal] El usuario no tiene libros en su biblioteca');
          return;
        }
        
        // Reset de las listas
        this.librosLeyendo = [];
        this.librosPendientes = [];
        this.librosTerminados = [];
        this.librosAbandonados = [];
        
        // Crear un array de observables para obtener detalles de cada libro
        const observables = usuarioLibros.map(usuarioLibro => 
          this.libroService.getLibroById(usuarioLibro.libroId).pipe(
            // Combinamos la información del libro con la relación usuario-libro
            map(libro => {
              console.log(`[BibliotecaPersonal] Detalle del libro ${libro.id} obtenido`);
              // Crear un nuevo objeto explícitamente con las propiedades combinadas
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
                // Añadimos las propiedades de la relación usuario-libro
                usuarioLibroId: usuarioLibro.id,
                estadoLectura: usuarioLibro.estadoLectura,
                valoracion: usuarioLibro.valoracion,
                comentario: usuarioLibro.comentario,
                fechaInicioLectura: usuarioLibro.fechaInicioLectura,
                fechaFinLectura: usuarioLibro.fechaFinLectura
              };
            })
          )
        );
        
        console.log(`[BibliotecaPersonal] Realizando ${observables.length} peticiones para obtener detalles de libros`);
        
        // Ejecutar todas las peticiones en paralelo
        forkJoin(observables).subscribe({
          next: (librosConEstado) => {
            console.log('[BibliotecaPersonal] Detalles de todos los libros recibidos, clasificando...');
            // Clasificar los libros según su estado
            librosConEstado.forEach(libro => {
              switch(libro.estadoLectura) {
                case 'LEYENDO':
                  this.librosLeyendo.push(libro);
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
                  console.warn('[BibliotecaPersonal] Estado de lectura desconocido:', libro.estadoLectura);
              }
            });
            
            console.log('[BibliotecaPersonal] Clasificación completada:');
            console.log(`- Leyendo: ${this.librosLeyendo.length}`);
            console.log(`- Pendientes: ${this.librosPendientes.length}`);
            console.log(`- Terminados: ${this.librosTerminados.length}`);
            console.log(`- Abandonados: ${this.librosAbandonados.length}`);
          },
          error: (error) => {
            console.error('[BibliotecaPersonal] Error al obtener detalles de los libros', error);
            this.notificationService.error('Error', {
              description: 'No se pudieron cargar todos los detalles de tus libros'
            });
          }
        });
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error al cargar la biblioteca personal', error);
        this.notificationService.error('Error', {
          description: 'No se pudo cargar tu biblioteca personal'
        });
      }
    });
  }

  /**
   * Actualiza el estado de lectura de un libro
   */
  actualizarEstadoLectura(): void {
    console.log('[BibliotecaPersonal] Actualizando estado de lectura');
    if (!this.libroSeleccionado || !this.usuarioId) {
      console.error('[BibliotecaPersonal] Datos incompletos para actualizar');
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
      console.log('[BibliotecaPersonal] Estableciendo fecha de finalización automática:', usuarioLibroActualizado.fechaFinLectura);
    }
    
    console.log('[BibliotecaPersonal] Enviando actualización:', usuarioLibroActualizado);
    
    this.usuarioLibroService.updateUsuarioLibro(
      this.libroSeleccionado.usuarioLibroId, 
      usuarioLibroActualizado
    ).subscribe({
      next: () => {
        console.log('[BibliotecaPersonal] Estado actualizado correctamente');
        this.notificationService.success('Estado actualizado', {
          description: 'El estado del libro se ha actualizado correctamente'
        });
        this.cerrarEdicion();
        this.cargarLibrosUsuario();
      },
      error: (error) => {
        console.error('[BibliotecaPersonal] Error al actualizar estado de lectura', error);
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
    console.log('[BibliotecaPersonal] Preparando edición del libro:', libro.titulo);
    this.libroSeleccionado = { ...libro };
    this.mostrarEdicion = true;
  }

  /**
   * Cierra el panel de edición
   */
  cerrarEdicion(): void {
    console.log('[BibliotecaPersonal] Cerrando panel de edición');
    this.libroSeleccionado = null;
    this.mostrarEdicion = false;
  }

  /**
   * Elimina un libro de la biblioteca personal
   */
  eliminarDeColeccion(libro: any): void {
    console.log('[BibliotecaPersonal] Solicitando confirmación para eliminar libro:', libro.titulo);
    this.notificationService.confirm({
      title: '¿Eliminar libro?',
      text: '¿Estás seguro de eliminar este libro de tu biblioteca?',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (resultado) {
        console.log('[BibliotecaPersonal] Confirmación recibida, eliminando libro de la biblioteca');
        this.usuarioLibroService.deleteUsuarioLibro(libro.usuarioLibroId).subscribe({
          next: () => {
            console.log('[BibliotecaPersonal] Libro eliminado correctamente');
            this.notificationService.success('Libro eliminado', {
              description: 'El libro ha sido eliminado de tu biblioteca'
            });
            this.cargarLibrosUsuario();
          },
          error: (error) => {
            console.error('[BibliotecaPersonal] Error al eliminar libro de la biblioteca', error);
            this.notificationService.error('Error', {
              description: 'No se pudo eliminar el libro de tu biblioteca'
            });
          }
        });
      } else {
        console.log('[BibliotecaPersonal] Eliminación cancelada por el usuario');
      }
    });
  }

  /**
   * Cambia el filtro de visualización de libros
   */
  cambiarFiltro(filtro: string): void {
    console.log('[BibliotecaPersonal] Cambiando filtro a:', filtro);
    this.filtroActual = filtro;
  }

  /**
   * Obtiene la URL completa de la imagen
   */
  getImageUrl(imagen: string | null): string {
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
}
