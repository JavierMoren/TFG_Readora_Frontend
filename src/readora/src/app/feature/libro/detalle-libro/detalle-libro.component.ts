import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { Libro } from '../../../models/libro/libro.model';
import { Autor } from '../../../models/autor/autor.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-detalle-libro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-libro.component.html',
  styleUrl: './detalle-libro.component.css'
})
export class DetalleLibroComponent implements OnInit {
  libro: Libro | null = null;
  autores: Autor[] = [];
  loading: boolean = true;
  error: string | null = null;
  libroId: number = 0;
  
  // Datos del usuario
  usuarioId: number | null = null;
  isLoggedIn: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private librosService: LibrosService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private usuarioLibroService: UsuarioLibroService,
    private authService: AutenticacionService
  ) {
    console.log('[DetalleLibro] Componente creado');
  }

  ngOnInit(): void {
    console.log('[DetalleLibro] Inicializando componente');
    // Verificar si el usuario está autenticado
    this.authService.isLoggedIn().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      console.log('[DetalleLibro] Estado de autenticación:', loggedIn ? 'Autenticado' : 'No autenticado');
      if (loggedIn) {
        this.authService.getUserInfo().subscribe({
          next: (userData) => {
            if (userData && userData.id) {
              this.usuarioId = userData.id;
              console.log('[DetalleLibro] ID de usuario obtenido:', userData.id);
            }
          },
          error: (error) => {
            console.error('[DetalleLibro] Error al obtener información del usuario', error);
          }
        });
      }
    });
  
    this.route.params.subscribe(params => {
      this.libroId = +params['id']; // Guardamos el ID para poder usarlo en la plantilla
      console.log('[DetalleLibro] Inicializando componente de detalle para el libro con ID:', this.libroId);
      this.loadLibro(this.libroId);
    });
  }

  loadLibro(id: number): void {
    this.loading = true;
    this.error = null;
    console.log('[DetalleLibro] Cargando información del libro con ID:', id);

    // Realizamos dos llamadas paralelas: una para el libro y otra para sus autores
    forkJoin({
      libro: this.librosService.getLibroById(id),
      autores: this.librosService.getAutoresByLibroId(id)
    }).subscribe({
      next: (result) => {
        this.libro = result.libro;
        this.autores = result.autores;
        this.loading = false;
        console.log('[DetalleLibro] Libro cargado correctamente:', this.libro);
        console.log('[DetalleLibro] Autores del libro cargados:', this.autores);
      },
      error: (err) => {
        console.error('[DetalleLibro] Error al cargar el detalle del libro:', err);
        this.error = 'No se pudo cargar la información completa del libro.';
        this.loading = false;
        this.notificationService.error('Error', {
          description: 'No se pudo cargar la información del libro'
        });
      }
    });
  }
  
  // Método para recargar el libro actual
  reloadLibro(): void {
    console.log('[DetalleLibro] Recargando información del libro');
    this.loadLibro(this.libroId);
  }
  
  // Método para obtener la URL completa de la imagen de portada
  getPortadaUrl(path: string | null | undefined): string {
    const url = this.storageService.getFullImageUrl(path || null);
    console.log('[DetalleLibro] URL de portada generada:', url);
    return url;
  }
  
  // Método para obtener la URL completa de la imagen de autor
  getAutorImageUrl(path: string | null | undefined): string {
    if (!path) {
      console.log('[DetalleLibro] Usando imagen predeterminada para autor');
      return 'assets/images/default-author.jpg';
    }
    const url = this.storageService.getFullImageUrl(path);
    console.log('[DetalleLibro] URL de imagen de autor generada:', url);
    return url;
  }

  /**
   * Añade el libro actual a la biblioteca del usuario
   */
  agregarABiblioteca(): void {
    console.log('[DetalleLibro] Intentando añadir libro a biblioteca');
    if (!this.isLoggedIn) {
      console.log('[DetalleLibro] Usuario no autenticado, mostrando notificación');
      this.notificationService.warning('Inicio de sesión requerido', {
        description: 'Debes iniciar sesión para añadir libros a tu biblioteca'
      });
      return;
    }

    if (!this.usuarioId || !this.libro) {
      console.error('[DetalleLibro] Falta información necesaria: usuarioId o libro');
      return;
    }
    
    const nuevoUsuarioLibro = {
      usuarioId: this.usuarioId,
      libroId: this.libro.id,
      estadoLectura: 'PENDIENTE', // Por defecto se añade como pendiente
      valoracion: null,
      comentario: '',
      fechaInicioLectura: null,
      fechaFinLectura: null
    };
    
    console.log('[DetalleLibro] Enviando solicitud para añadir libro:', nuevoUsuarioLibro);
    this.usuarioLibroService.createUsuarioLibro(nuevoUsuarioLibro).subscribe({
      next: (response) => {
        console.log('[DetalleLibro] Libro añadido correctamente a la biblioteca', response);
        this.notificationService.success('Libro añadido', {
          description: 'El libro ha sido añadido a tu biblioteca con éxito'
        });
      },
      error: (error) => {
        console.error('[DetalleLibro] Error al añadir libro a la biblioteca', error);
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
}
