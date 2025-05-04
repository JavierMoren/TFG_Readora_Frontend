import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Autor } from '../../../models/autor/autor.model';
import { AutorService } from '../../../core/services/autor.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-admin-autores',
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './admin-autores.component.html',
  styleUrl: './admin-autores.component.css'
})
export class AdminAutoresComponent implements OnInit {
  // Array para almacenar todos los autores
  autores: Autor[] = [];
  // Variables para la paginación
  paginatedAutores: Autor[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  // Autor actual que se está creando o editando
  currentAutor: any = this.initializeAutor();
  // Detalles del autor seleccionado
  autorDetalle: Autor | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  // Archivo seleccionado para subir
  selectedFile: File | null = null;
  // URL para previsualización de la imagen
  previewImageUrl: string | null = null;
  // Indica si se está subiendo una imagen
  isUploading: boolean = false;

  // Propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Eliminar Autor?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  autorIdToDelete: number | null = null;

  constructor(
    private autorService: AutorService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    // Carga todos los autores al inicializar el componente
    this.getAllAutores();
  }

  /**
   * Obtiene todos los autores del sistema mediante el servicio
   */
  getAllAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (data) => {
        this.autores = data;
        this.updatePagination();
      },
      error: (error) => {
        console.error('Error al cargar autores', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los autores',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Actualiza la paginación y los autores mostrados
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.autores.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    this.updateDisplayedAutores();
  }

  /**
   * Actualiza los autores que se muestran según la página actual
   */
  updateDisplayedAutores(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.autores.length);
    this.paginatedAutores = this.autores.slice(startIndex, endIndex);
  }

  /**
   * Cambia a la página especificada
   * @param page - Número de página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updateDisplayedAutores();
    }
  }

  /**
   * Va a la página anterior
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedAutores();
    }
  }

  /**
   * Va a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedAutores();
    }
  }

  /**
   * Obtiene un autor específico por su ID
   * @param id - ID del autor a buscar
   */
  getAutorById(id: number): void {
    this.autorService.getAutorById(id).subscribe({
      next: (autor) => {
        this.autorDetalle = autor;
      },
      error: (error) => {
        console.error('Error al obtener detalles del autor', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los detalles del autor',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Maneja la selección de archivos para la imagen
   * @param event - Evento de selección de archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Validar tamaño (máx 2MB)
      if (this.selectedFile.size > 2 * 1024 * 1024) {
        toast.error('Error', { 
          description: 'La imagen no debe superar los 2MB',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.selectedFile = null;
        input.value = '';
        return;
      }
      
      // Validar tipo
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(this.selectedFile.type)) {
        toast.error('Error', { 
          description: 'Solo se permiten imágenes en formato JPG o PNG',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.selectedFile = null;
        input.value = '';
        return;
      }
      
      // Crear URL para previsualización
      this.previewImageUrl = URL.createObjectURL(this.selectedFile);
    }
  }

  /**
   * Sube la imagen al servidor y guarda el autor
   */
  async uploadImageAndSaveAutor(): Promise<void> {
    try {
      if (this.selectedFile) {
        this.isUploading = true;
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        // Subir imagen y obtener URL
        const response = await this.storageService.uploadFile(formData, 'autor').toPromise();
        this.currentAutor.fotoUrl = response.path; // Guardamos la ruta relativa, no la URL completa
      }
      
      // Guardar autor con o sin imagen nueva
      if (this.isEditing) {
        await this.autorService.updateAutor(this.currentAutor).toPromise();
        toast.success('Éxito', { 
          description: 'Autor actualizado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      } else {
        await this.autorService.createAutor(this.currentAutor).toPromise();
        toast.success('Éxito', { 
          description: 'Autor creado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
      
      this.getAllAutores();
      this.cancelEdit();
    } catch (error) {
      console.error('Error al procesar el autor', error);
      toast.error('Error', { 
        description: this.isEditing ? 'No se pudo actualizar el autor' : 'No se pudo crear el autor',
        action: {
          label: 'Cerrar',
          onClick: () => toast.dismiss(),
        },
      });
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Prepara el formulario para crear un nuevo autor
   */
  prepareCreateAutor(): void {
    this.isEditing = false;
    this.currentAutor = this.initializeAutor();
    this.selectedFile = null;
    this.previewImageUrl = null;
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un autor existente
   * @param autor - Autor a editar
   */
  prepareUpdateAutor(autor: Autor): void {
    this.isEditing = true;
    this.currentAutor = { ...autor };
    this.selectedFile = null;
    this.previewImageUrl = autor.fotoUrl ? this.getImageUrl(autor.fotoUrl) : null;
    this.showForm = true;
  }

  /**
   * Determina si debe crear o actualizar un autor
   */
  saveAutor(): void {
    this.uploadImageAndSaveAutor();
  }

  /**
   * Muestra el modal de confirmación para eliminar un autor
   * @param id - ID del autor a eliminar
   */
  deleteAutor(id: number): void {
    this.autorIdToDelete = id;
    this.confirmModalTitle = '¿Eliminar Autor?';
    this.confirmModalMessage = '¿Estás seguro de que deseas eliminar este autor? Esta acción no se puede deshacer.';
    setTimeout(() => {
      this.showConfirmModal = true;
    }, 0);
  }

  /**
   * Confirma la eliminación del autor después de que el usuario acepta en el modal
   */
  confirmDeleteAutor(): void {
    if (this.autorIdToDelete) {
      this.autorService.deleteAutor(this.autorIdToDelete).subscribe({
        next: () => {
          toast.success('Eliminado', { 
            description: 'El autor ha sido eliminado correctamente',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.getAllAutores();
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error('Error al eliminar autor', error);
          toast.error('Error', { 
            description: 'No se pudo eliminar el autor',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.closeDeleteModal();
        }
      });
    }
  }

  /**
   * Cancela la eliminación del autor
   */
  cancelDeleteAutor(): void {
    this.closeDeleteModal();
  }

  /**
   * Cierra el modal de eliminación y reinicia las variables
   */
  private closeDeleteModal(): void {
    this.showConfirmModal = false;
    this.autorIdToDelete = null;
  }

  /**
   * Cancela la edición/creación de un autor
   */
  cancelEdit(): void {
    this.showForm = false;
    this.currentAutor = this.initializeAutor();
    this.selectedFile = null;
    this.previewImageUrl = null;
  }

  /**
   * Cierra el panel de detalles del autor
   */
  closeDetails(): void {
    this.autorDetalle = null;
  }

  /**
   * Obtiene la URL completa de la imagen
   * @param path Ruta relativa de la imagen
   * @returns URL completa para acceder a la imagen
   */
  getImageUrl(path: string | null): string {
    return this.storageService.getFullImageUrl(path);
  }

  /**
   * Obtiene el número máximo de elementos a mostrar en la página actual
   * (para usar en el template de paginación)
   */
  getMaxItems(): number {
    return Math.min(this.currentPage * this.pageSize, this.autores.length);
  }

  /**
   * Inicializa un objeto autor vacío
   */
  private initializeAutor(): any {
    return {
      id: null,
      nombre: '',
      apellido: '',
      nacionalidad: '',
      fotoUrl: null,
      fechaNacimiento: null,
      fechaFallecimiento: null,
      biografia: '',
    };
  }
}