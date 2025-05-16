import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LibrosService } from '../../../core/services/libros.service';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Libro } from '../../../models/libro/libro.model';
import { Autor } from '../../../models/autor/autor.model';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { UsuarioLibro } from '../../../models/usuario-libro/usuario-libro.model';

@Component({
  selector: 'app-detalle-libro',
  
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-libro.component.html',
  styleUrls: ['./detalle-libro.component.css']
})
export class DetalleLibroComponent implements OnInit {
  libroId!: number;
  libro: Libro | null = null;
  autores: Autor[] | null = null;
  loading: boolean = true;
  error: string | null = null;
  isLoggedIn: boolean = false;
  usuarioId: number | null = null;
  enBiblioteca: boolean = false;
  usuarioLibroId: number | null = null;
  eliminando: boolean = false;
  agregando: boolean = false;

  // Rutas para imágenes predeterminadas
  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private libroService: LibrosService,
    private autorService: AutorService,
    public storageService: StorageService,
    private authService: AutenticacionService,
    private notificationService: NotificationService,
    private usuarioLibroService: UsuarioLibroService
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        this.cargarDatosUsuario();
      }
    });

    // Obtener el ID del libro de la URL
    this.route.params.subscribe(params => {
      this.libroId = +params['id'];
      this.loadLibro();
    });
  }

  cargarDatosUsuario(): void {
    this.authService.getUserInfo().subscribe({
      next: (userData) => {
        if (userData && userData.id) {
          this.usuarioId = userData.id;
          // Si ya tenemos el ID del libro, verificar si está en la biblioteca
          if (this.libroId) {
            this.verificarLibroEnBiblioteca();
          }
        }
      },
      error: (error) => {
        console.error('[DetalleLibro] Error al cargar datos del usuario', error);
      }
    });
  }

  verificarLibroEnBiblioteca(): void {
    if (!this.usuarioId || !this.libroId) return;
    
    this.usuarioLibroService.getLibrosByUsuarioId(this.usuarioId).subscribe({
      next: (usuarioLibros) => {
        // Buscar si el libro actual está en la lista de libros del usuario
        const relacion = usuarioLibros?.find(ul => ul.libroId === this.libroId);
        if (relacion) {
          this.enBiblioteca = true;
          this.usuarioLibroId = relacion.id ?? null;
        } else {
          this.enBiblioteca = false;
          this.usuarioLibroId = null;
        }
      },
      error: (error) => {
        console.error('[DetalleLibro] Error al verificar libro en biblioteca', error);
      }
    });
  }

  loadLibro(): void {
    this.loading = true;
    this.error = null;

    this.libroService.getLibroById(this.libroId).subscribe({
      next: (libro) => {
        this.libro = libro;
        // Cargar autores si están disponibles
        this.cargarAutores();
        // Si el usuario está logueado, verificar si el libro está en su biblioteca
        if (this.isLoggedIn && this.usuarioId) {
          this.verificarLibroEnBiblioteca();
        }
      },
      error: (error: any) => {
        console.error('[DetalleLibro] Error al cargar detalles del libro', error);
        this.error = 'No se pudo cargar el libro. Por favor, inténtelo de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  cargarAutores(): void {
    if (this.libro && this.libro.id) {
      this.libroService.getAutoresByLibroId(this.libro.id).subscribe({
        next: (autores: Autor[]) => {
          this.autores = autores;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('[DetalleLibro] Error al cargar autores del libro', error);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  getPortadaUrl(url: string | null | undefined): string {
    if (!url) {
      return this.libroPlaceholder;
    }
    return this.storageService.getFullImageUrl(url);
  }

  getAutorImageUrl(url: string | null | undefined): string {
    if (!url) {
      return this.autorPlaceholder;
    }
    return this.storageService.getFullImageUrl(url);
  }

  reloadLibro(): void {
    this.loadLibro();
  }

  agregarABiblioteca(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/api/v1/authenticate'], { 
        queryParams: { returnUrl: `/libros/${this.libroId}` } 
      });
      return;
    }

    this.agregando = true;

    this.authService.getUserInfo().subscribe({
      next: (userData) => {
        if (userData && userData.id && this.libro) {
          const usuarioLibro: UsuarioLibro = {
            id: undefined, // Usando undefined en lugar de null para cumplir con la interfaz
            usuarioId: userData.id,
            libroId: this.libro.id,
            estadoLectura: 'PENDIENTE',
            valoracion: null,
            comentario: null,
            fechaInicioLectura: null,
            fechaFinLectura: null
          };

          this.usuarioLibroService.createUsuarioLibro(usuarioLibro).subscribe({
            next: (response) => {
              this.notificationService.success('Biblioteca actualizada', {
                description: 'El libro se ha añadido a tu biblioteca personal'
              });
              // Actualizar el estado local
              this.enBiblioteca = true;
              this.usuarioLibroId = response?.id ? response.id : null;
              this.agregando = false;
            },
            error: (err) => {
              this.agregando = false;
              this.notificationService.error('Error', {
                description: 'No se pudo añadir el libro a tu biblioteca'
              });
            }
          });
        } else {
          this.agregando = false;
        }
      },
      error: (err) => {
        this.agregando = false;
        this.notificationService.error('Error', {
          description: 'No se pudo verificar tu información de usuario'
        });
      }
    });
  }

  eliminarDeColeccion(): void {
    if (!this.isLoggedIn || !this.usuarioLibroId) {
      return;
    }
    
    // Mostrar confirmación
    this.notificationService.confirm({
      title: '¿Eliminar libro?',
      text: '¿Estás seguro de eliminar este libro de tu biblioteca?',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (resultado) {
        this.eliminando = true;
        
        this.usuarioLibroService.deleteUsuarioLibro(this.usuarioLibroId!).subscribe({
          next: () => {
            this.notificationService.success('Libro eliminado', {
              description: 'El libro ha sido eliminado de tu biblioteca'
            });
            
            // Actualizar estado local
            this.enBiblioteca = false;
            this.usuarioLibroId = null;
            this.eliminando = false;
          },
          error: (error) => {
            this.eliminando = false;
            this.notificationService.error('Error', {
              description: 'No se pudo eliminar el libro de tu biblioteca'
            });
          }
        });
      }
    });
  }
}
