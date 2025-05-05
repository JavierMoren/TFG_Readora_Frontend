import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Autor } from '../../../models/autor/autor.model';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-autores',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-autores.component.html',
  styleUrl: './admin-autores.component.css'
})
export class AdminAutoresComponent implements OnInit {
  // Array para almacenar todos los autores
  autores: Autor[] = [];
  // Array para los autores filtrados según la búsqueda
  displayedAutores: Autor[] = [];
  // Autor actual que se está creando o editando
  currentAutor: any = this.initializeAutor();
  // Detalles del autor seleccionado
  autorDetalle: Autor | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  // Variable para guardar el término de búsqueda
  searchTerm: string = '';
  
  // Control para la carga de imágenes
  selectedFile: File | null = null;
  // URL para previsualización de la imagen
  previewImageUrl: string | null = null;
  // Indica si se está subiendo una imagen
  isUploading: boolean = false;

  // Propiedades para el modal de confirmación
  autorIdToDelete: number | null = null;

  // Propiedades para la paginación
  currentPage: number = 1;
  pageSize: number = 8;
  totalPages: number = 1;

  constructor(
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getAllAutores();
  }

  /**
   * Obtiene todos los autores del sistema mediante el servicio
   */
  getAllAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (data) => {
        this.autores = data;
        this.updateDisplayedAutores();
        this.calculateTotalPages();
      },
      error: (error) => {
        console.error('Error al cargar autores', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los autores'
        });
      }
    });
  }

  /**
   * Obtiene un autor específico por su ID
   * @param id - ID del autor a buscar
   */
  getAutorById(id: number): void {
    this.autorService.getAutorById(id).subscribe({
      next: (data) => {
        this.autorDetalle = data;
      },
      error: (error) => {
        console.error('Error al cargar autor', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo cargar el autor'
        });
      }
    });
  }

  /**
   * Actualiza los autores mostrados según la página actual
   */
  updateDisplayedAutores(): void {
    // Aplicar filtro de búsqueda si existe
    let filtered = this.autores;
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = this.autores.filter(autor => 
        autor.nombre.toLowerCase().includes(term) || 
        autor.apellido.toLowerCase().includes(term)
      );
    }

    // Calcular índices para la paginación
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    // Asignar los autores que corresponden a la página actual
    this.displayedAutores = filtered.slice(startIndex, endIndex);
    
    // Recalcular el total de páginas
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    
    // Ajustar la página actual si está fuera de rango
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
      this.updateDisplayedAutores();
    }
  }

  /**
   * Maneja la búsqueda de autores
   */
  searchAutores(): void {
    this.currentPage = 1; // Volver a la primera página al buscar
    this.updateDisplayedAutores();
  }

  /**
   * Calcula el número total de páginas
   */
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.autores.length / this.pageSize);
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
   * Maneja la selección de archivos para la imagen
   * @param event - Evento de selección de archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    
    this.selectedFile = input.files[0];
    
    // Validar tamaño (2MB máximo)
    if (this.selectedFile.size > 2 * 1024 * 1024) {
      this.notificationService.warning('Archivo demasiado grande', { 
        description: 'La imagen no puede superar los 2MB'
      });
      this.selectedFile = null;
      input.value = '';
      return;
    }
    
    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(this.selectedFile.type)) {
      this.notificationService.error('Formato no válido', { 
        description: 'Solo se permiten imágenes en formato JPG o PNG'
      });
      this.selectedFile = null;
      input.value = '';
      return;
    }
    
    // Crear URL para previsualización
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImageUrl = reader.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  /**
   * Sube la imagen al servidor y guarda el autor
   */
  async uploadImageAndSaveAutor(): Promise<void> {
    try {
      this.isUploading = true;
      // Si se seleccionó un archivo, sube la imagen primero
      if (this.selectedFile) {
        const uploadResponse = await this.storageService.uploadAutorImage(this.selectedFile).toPromise();
        if (uploadResponse && uploadResponse.filename) {
          // Asigna el nombre del archivo a la propiedad foto del autor
          this.currentAutor.foto = uploadResponse.filename;
        }
      }
      
      // Luego guarda/actualiza el autor
      if (this.isEditing) {
        await this.autorService.updateAutor(this.currentAutor).toPromise();
        this.notificationService.success('Éxito', { 
          description: 'Autor actualizado correctamente'
        });
      } else {
        await this.autorService.createAutor(this.currentAutor).toPromise();
        this.notificationService.success('Éxito', { 
          description: 'Autor creado correctamente'
        });
      }
      
      // Recargar la lista de autores y limpiar el formulario
      this.getAllAutores();
      this.cancelEdit();
      this.isUploading = false;
    } catch (error) {
      console.error('Error al guardar autor', error);
      this.notificationService.error('Error', { 
        description: 'No se pudo guardar el autor'
      });
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
    
    // Mostrar la foto actual si existe
    if (autor.fotoUrl) {
      this.previewImageUrl = this.getImageUrl(autor.fotoUrl);
    } else {
      this.previewImageUrl = null;
    }
    
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
  async deleteAutor(id: number): Promise<void> {
    this.autorIdToDelete = id;
    
    const confirmed = await this.notificationService.confirm({
      title: '¿Eliminar Autor?',
      text: '¿Estás seguro de que deseas eliminar este autor? Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (confirmed) {
      this.confirmDeleteAutor();
    } else {
      this.autorIdToDelete = null;
    }
  }

  /**
   * Confirma la eliminación del autor después de que el usuario acepta en el modal
   */
  confirmDeleteAutor(): void {
    if (this.autorIdToDelete) {
      this.autorService.deleteAutor(this.autorIdToDelete).subscribe({
        next: () => {
          this.notificationService.success('Eliminado', { 
            description: 'El autor ha sido eliminado correctamente'
          });
          this.getAllAutores();
          this.autorIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar autor', error);
          this.notificationService.error('Error', { 
            description: 'No se pudo eliminar el autor'
          });
          this.autorIdToDelete = null;
        }
      });
    }
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
  getImageUrl(path: string | null): string | null {
    return this.autorService.getImageUrl(path);
  }

  /**
   * Obtiene el número máximo de elementos a mostrar en la página actual
   * (para usar en el template de paginación)
   */
  getMaxItems(): number {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.autores.length);
    return end;
  }

  /**
   * Inicializa un objeto autor vacío
   */
  private initializeAutor(): any {
    return {
      id: null,
      nombre: '',
      apellido: '',
      fechaNacimiento: null,
      fechaFallecimiento: null,
      biografia: '',
      foto: null
    };
  }
}