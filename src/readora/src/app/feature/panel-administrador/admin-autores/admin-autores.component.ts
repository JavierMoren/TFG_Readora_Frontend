import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Autor } from '../../../models/autor/autor.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-autores',
  
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-autores.component.html',
  styleUrl: './admin-autores.component.css'
})
export class AdminAutoresComponent implements OnInit {
  autores: Autor[] = [];
  currentAutor: any = {
    nombre: '',
    apellido: '',
    fechaNacimiento: null,
    fechaFallecimiento: null,
    biografia: '',
    fotoUrl: null
  };
  selectedFile: File | null = null;
  previewImageUrl: string | null = null;
  showForm: boolean = false;
  isEditing: boolean = false;
  isUploading: boolean = false;
  autorDetalle: Autor | null = null; 
  
  // Propiedades para la paginación del servidor
  currentPage: number = 0; // Paginación basada en 0 para el backend
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  searchTerm: string = '';
  searchId: number | null = null;
  tipoBusqueda: 'texto' | 'id' = 'texto';
  
  // Exponer Math para usarlo en la plantilla
  Math = Math;
  
  // Rutas para imágenes predeterminadas
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  // La función getPagesArray() se ha eliminado ya que ahora usamos una paginación simplificada

  constructor(
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAutoresPaginados();
  }

  loadAutoresPaginados(): void {
    this.autorService.getAllAutoresPaginados(
      this.currentPage, 
      this.pageSize, 
      this.sortBy, 
      this.sortDirection,
      this.searchTerm
    ).subscribe({
      next: (data) => {
        this.autores = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los autores'
        });
      }
    });
  }

  /**
   * Busca autores según el término de búsqueda ingresado
   */
  buscarAutores(): void {
    if (!this.searchTerm.trim()) {
      this.notificationService.warning('Atención', { 
        description: 'Ingrese un término de búsqueda'
      });
      return;
    }
    this.currentPage = 0; // Volver a la primera página al buscar
    this.loadAutoresPaginados();
  }

  /**
   * Busca un autor específico por su ID
   */
  buscarAutorPorId(): void {
    if (!this.searchId || this.searchId <= 0) {
      this.notificationService.warning('Atención', { 
        description: 'Ingrese un ID de autor válido'
      });
      return;
    }
    
    this.autorService.getAutorById(this.searchId).subscribe({
      next: (autor) => {
        this.autores = [autor];
        this.totalElements = 1;
        this.totalPages = 1;
        
        this.notificationService.success('Búsqueda completada', {
          description: `Se encontró el autor con ID ${this.searchId}`
        });
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: `No se encontró el autor con ID ${this.searchId}`
        });
        this.autores = [];
        this.totalElements = 0;
        this.totalPages = 0;
      }
    });
  }

  /**
   * Limpia la búsqueda por ID
   */
  limpiarBusquedaId(): void {
    this.searchId = null;
    this.currentPage = 0;
    this.loadAutoresPaginados();
  }

  /**
   * Limpia el término de búsqueda y muestra todos los autores
   */
  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadAutoresPaginados();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAutoresPaginados();
    }
  }

  changeSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      // Si ya está ordenando por este campo, cambia la dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0; // Vuelve a la primera página
    this.loadAutoresPaginados();
  }

  /**
   * Cambia el tamaño de página
   * @param size - Nuevo tamaño de página
   */
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Vuelve a la primera página
    this.loadAutoresPaginados();
  }

  prepareCreateAutor(): void {
    this.isEditing = false;
    this.currentAutor = {
      nombre: '',
      apellido: '',
      fechaNacimiento: null,
      fechaFallecimiento: null,
      biografia: '',
      fotoUrl: null
    };
    this.selectedFile = null;
    this.previewImageUrl = null;
    this.showForm = true;
  }

  prepareUpdateAutor(autor: Autor): void {
    this.isEditing = true;
    this.currentAutor = { ...autor };
    this.selectedFile = null;
    
    if (autor.fotoUrl) {
      this.previewImageUrl = this.getImageUrl(autor.fotoUrl);
    } else {
      this.previewImageUrl = null;
    }
    
    this.showForm = true;
  }

  cancelEdit(): void {
    this.showForm = false;
    this.currentAutor = {};
    this.previewImageUrl = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Crear una URL para vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveAutor(): void {
    if (!this.currentAutor.nombre || !this.currentAutor.apellido) {
      this.notificationService.warning('Error', { description: 'El nombre y apellido son obligatorios' });
      return;
    }
    
    this.isUploading = true;
    
    // Función para guardar o actualizar el autor
    const saveAutorFn = () => {
      if (this.isEditing) {
        this.autorService.updateAutor(this.currentAutor).subscribe({
          next: () => {
            this.notificationService.success('Éxito', { description: 'Autor actualizado correctamente' });
            this.showForm = false;
            this.isUploading = false;
            this.loadAutoresPaginados(); // Usar paginación en lugar de loadAutores
          },
          error: (error) => {
            this.notificationService.error('Error', { description: 'No se pudo actualizar el autor' });
            this.isUploading = false;
          }
        });
      } else {
        this.autorService.createAutor(this.currentAutor).subscribe({
          next: () => {
            this.notificationService.success('Éxito', { description: 'Autor creado correctamente' });
            this.showForm = false;
            this.isUploading = false;
            this.loadAutoresPaginados(); // Usar paginación en lugar de loadAutores
          },
          error: (error) => {
            this.notificationService.error('Error', { description: 'No se pudo crear el autor' });
            this.isUploading = false;
          }
        });
      }
    };
    
    // Si hay un archivo seleccionado, subirlo primero
    if (this.selectedFile) {
      this.storageService.uploadAutorFoto(this.selectedFile).subscribe({
        next: (response: any) => {

          if (response && response.path) {
            // Usar path en lugar de filename para mantener consistencia
            this.currentAutor.fotoUrl = response.path;
          }
          saveAutorFn();
        },
        error: (error: any) => {
          this.notificationService.error('Error', { description: 'No se pudo subir la foto del autor' });
          this.isUploading = false;
        }
      });
    } else {
      saveAutorFn();
    }
  }

  deleteAutor(id: number): void {
    this.notificationService.confirm({
      title: 'Eliminar autor',
      text: '¿Estás seguro de que deseas eliminar este autor? Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result) {
        this.autorService.deleteAutor(id).subscribe({
          next: () => {
            this.notificationService.success('Éxito', { description: 'Autor eliminado correctamente' });
            this.loadAutoresPaginados(); // Usar paginación en lugar de loadAutores
          },
          error: (error) => {
            this.notificationService.error('Error', { description: 'No se pudo eliminar el autor' });
          }
        });
      }
    });
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) {
      return this.autorPlaceholder;
    }
    return this.storageService.getFullImageUrl(url);
  }

  /**
   * Elimina la foto de un autor
   */
  eliminarFoto(): void {
    // Confirmar la eliminación
    this.notificationService.confirm({
      title: '¿Eliminar fotografía?',
      text: 'Esta acción establecerá una imagen predeterminada para el autor',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result) {
        // Si el usuario confirma, eliminamos la foto
        if (this.currentAutor.fotoUrl) {
          // Si la foto ya se había guardado en el servidor
          if (this.isEditing && this.currentAutor.id) {
            // Establecemos la URL a null (se usará la predeterminada)
            this.currentAutor.fotoUrl = null;
            this.previewImageUrl = this.autorService.getImageUrl(null);
            
            this.notificationService.success('Fotografía eliminada', { 
              description: 'Se ha establecido la imagen predeterminada'
            });
          } else {
            // Si el autor es nuevo, simplemente resetear
            this.currentAutor.fotoUrl = null;
            this.selectedFile = null;
            this.previewImageUrl = null;
          }
        }
      }
    });
  }

  verDetalleAutor(autor: Autor): void {
    if (autor && autor.id) {
      this.router.navigate(['/autores', autor.id]);
    }
  }
}