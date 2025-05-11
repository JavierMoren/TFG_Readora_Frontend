import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Autor } from '../../../models/autor/autor.model';

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
  
  // Propiedades para la paginación del servidor
  currentPage: number = 0; // Paginación basada en 0 para el backend
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  // Exponer Math para usarlo en la plantilla
  Math = Math;
  
  // Rutas para imágenes predeterminadas
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  // La función getPagesArray() se ha eliminado ya que ahora usamos una paginación simplificada

  constructor(
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadAutoresPaginados();
  }

  loadAutoresPaginados(): void {
    this.autorService.getAllAutoresPaginados(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data) => {
        this.autores = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
      },
      error: (error) => {
        console.error('[AdminAutores] Error al cargar autores', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los autores'
        });
      }
    });
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

  // Método legacy para cargar todos los autores, ahora es un respaldo
  loadAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (autores) => {
        this.autores = autores;
      },
      error: (error) => {
        console.error('[AdminAutores] Error al cargar la lista completa de autores', error);
        this.notificationService.error('Error', { description: 'No se pudo cargar la lista de autores' });
      }
    });
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
            console.error(`[AdminAutores] Error al actualizar autor ID=${this.currentAutor.id}`, error);
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
            console.error('[AdminAutores] Error al crear autor', error);
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
          this.currentAutor.fotoUrl = response.filename;
          saveAutorFn();
        },
        error: (error: any) => {
          console.error('[AdminAutores] Error al subir foto del autor', error);
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
            console.error(`[AdminAutores] Error al eliminar autor ID=${id}`, error);
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
}