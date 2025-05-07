import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Libro } from '../../../models/libro/libro.model';
import { Autor } from '../../../models/autor/autor.model';
import { LibroService } from '../../../core/services/libro.service';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-libros',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-libros.component.html',
  styleUrl: './admin-libros.component.css'
})
export class AdminLibrosComponent implements OnInit {
  // Array para almacenar todos los libros
  libros: Libro[] = [];
  // Libro actual que se está creando o editando
  currentLibro: any = this.initializeLibro();
  // Detalles del libro seleccionado
  libroDetalle: Libro | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  // Variable para guardar el término de búsqueda
  searchTerm: string = '';
  
  // Control para la carga de imágenes
  selectedFile: File | null = null;
  // URL para previsualización de la imagen de portada
  previewPortadaUrl: string | null = null;
  // Indica si se está subiendo una imagen
  isUploading: boolean = false;
  
  // Propiedades para la paginación
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  // Propiedades para eliminar un libro
  libroIdToDelete: number | null = null;

  // Para selector de autores
  allAutores: Autor[] = [];
  selectedAutorId: number | null = null;
  showAutorSelectorModal: boolean = false;

  // Rutas para imágenes predeterminadas
  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';

  constructor(
    private librosService: LibroService,
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getLibrosPaginados();
    this.loadAutores();
  }

  /**
   * Carga todos los autores para poder asociarlos a libros
   */
  loadAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (data) => {
        this.allAutores = data;
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
   * Obtiene los libros con paginación
   */
  getLibrosPaginados(): void {
    this.librosService.getLibrosPaginados(
      this.currentPage, 
      this.pageSize, 
      this.sortBy, 
      this.sortDirection,
      this.searchTerm
    ).subscribe({
      next: (data) => {
        this.libros = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
      },
      error: (error) => {
        console.error('Error al cargar libros', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los libros'
        });
      }
    });
  }

  /**
   * Prepara el formulario para crear un nuevo libro
   */
  prepareCreateLibro(): void {
    this.isEditing = false;
    this.currentLibro = this.initializeLibro();
    this.selectedFile = null;
    this.previewPortadaUrl = null;
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un libro existente
   * @param libro - Libro a editar
   */
  prepareUpdateLibro(libro: Libro): void {
    this.isEditing = true;
    this.currentLibro = {
      ...libro,
      autores: libro.autores || []
    };
    this.selectedFile = null;
    
    // Mostrar la portada actual si existe
    if (libro.portadaUrl) {
      this.previewPortadaUrl = this.librosService.getImageUrl(libro.portadaUrl);
    } else {
      this.previewPortadaUrl = null;
    }
    
    this.showForm = true;
  }

  /**
   * Determina si debe crear o actualizar un libro
   */
  saveLibro(): void {
    this.uploadImageAndSaveLibro();
  }

  /**
   * Sube la imagen de portada al servidor y guarda el libro
   */
  async uploadImageAndSaveLibro(): Promise<void> {
    try {
      this.isUploading = true;
      // Si se seleccionó un archivo, sube la imagen primero
      if (this.selectedFile) {
        const uploadResponse = await this.storageService.uploadLibroImage(this.selectedFile).toPromise();
        if (uploadResponse && uploadResponse.filename) {
          // Asigna el nombre del archivo a la propiedad portadaUrl del libro
          this.currentLibro.portadaUrl = uploadResponse.filename;
        }
      }
      
      // Luego guarda/actualiza el libro
      if (this.isEditing) {
        await this.librosService.updateLibro(this.currentLibro).toPromise();
        this.notificationService.success('Éxito', { 
          description: 'Libro actualizado correctamente'
        });
      } else {
        await this.librosService.createLibro(this.currentLibro).toPromise();
        this.notificationService.success('Éxito', { 
          description: 'Libro creado correctamente'
        });
      }
      
      // Recargar la lista de libros y limpiar el formulario
      this.getLibrosPaginados();
      this.cancelEdit();
      this.isUploading = false;
    } catch (error: any) {
      console.error('Error al guardar libro', error);
      this.notificationService.error('Error', { 
        description: 'No se pudo guardar el libro'
      });
      this.isUploading = false;
    }
  }

  /**
   * Elimina un libro
   * @param id - ID del libro a eliminar
   */
  async deleteLibro(id: number): Promise<void> {
    this.libroIdToDelete = id;
    
    const confirmed = await this.notificationService.confirm({
      title: '¿Eliminar libro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (confirmed) {
      this.confirmDeleteLibro();
    } else {
      this.libroIdToDelete = null;
    }
  }
  
  /**
   * Confirma la eliminación del libro
   */
  confirmDeleteLibro(): void {
    if (this.libroIdToDelete !== null) {
      this.librosService.deleteLibro(this.libroIdToDelete).subscribe({
        next: () => {
          this.notificationService.success('Eliminado', { 
            description: 'El libro ha sido eliminado correctamente'
          });
          this.getLibrosPaginados();
          this.libroIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar libro', error);
          this.notificationService.error('Error', { 
            description: 'No se pudo eliminar el libro'
          });
          this.libroIdToDelete = null;
        }
      });
    }
  }

  /**
   * Cancela la eliminación del libro
   */
  cancelDeleteLibro(): void {
    this.libroIdToDelete = null;
  }

  /**
   * Busca libros con el término ingresado
   */
  searchLibros(): void {
    this.currentPage = 0;
    this.getLibrosPaginados();
  }

  /**
   * Cambia a una página específica
   * @param page - Número de página (base 0)
   */
  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getLibrosPaginados();
    }
  }

  /**
   * Selecciona un autor para agregarlo al libro
   */
  selectAutor(): void {
    if (this.selectedAutorId) {
      // Buscar el autor completo basado en su ID
      const autorSeleccionado = this.allAutores.find(a => a.id === this.selectedAutorId);
      
      if (autorSeleccionado) {
        // Inicializar el array de autores si es nulo
        if (!this.currentLibro.autores) {
          this.currentLibro.autores = [];
        }
        
        // Verificar que no esté ya en la lista
        const yaExiste = this.currentLibro.autores.some((a: any) => a.id === autorSeleccionado.id);
        
        if (!yaExiste) {
          // Añadir a la lista de autores del libro
          this.currentLibro.autores.push(autorSeleccionado);
          this.notificationService.info('Autor agregado', { 
            description: `${autorSeleccionado.nombre} ${autorSeleccionado.apellido} añadido al libro`
          });
        } else {
          this.notificationService.warning('Autor ya incluido', { 
            description: 'Este autor ya está añadido al libro'
          });
        }
      }
    }
    
    // Limpiar selección y cerrar modal
    this.selectedAutorId = null;
    this.showAutorSelectorModal = false;
  }

  /**
   * Elimina un autor de la lista de autores del libro
   * @param autor - Autor a eliminar
   */
  removeAutor(autor: Autor): void {
    this.currentLibro.autores = this.currentLibro.autores.filter((a: any) => a.id !== autor.id);
    this.notificationService.info('Autor eliminado', { 
      description: `${autor.nombre} ${autor.apellido} eliminado del libro`
    });
  }

  /**
   * Cancela la edición/creación de un libro
   */
  cancelEdit(): void {
    this.showForm = false;
    this.currentLibro = this.initializeLibro();
    this.selectedFile = null;
    this.previewPortadaUrl = null;
  }

  /**
   * Cierra el panel de detalles del libro
   */
  closeDetails(): void {
    this.libroDetalle = null;
  }

  /**
   * Muestra el selector de autores
   */
  showAutorSelector(): void {
    this.showAutorSelectorModal = true;
    this.selectedAutorId = null;
  }

  /**
   * Crea un objeto libro con valores por defecto
   */
  private initializeLibro(): any {
    return {
      id: null,
      titulo: '',
      isbn: '',
      numeroPaginas: null,
      fechaPublicacion: null,
      sinopsis: '',
      portadaUrl: null,
      autores: []
    };
  }

  /**
   * Devuelve la fecha actual en formato ISO para usarla como valor máximo en inputs de tipo fecha
   */
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Maneja la selección de archivo de imagen para la portada del libro
   * @param event - Evento del input de tipo file
   */
  onFileSelected(event: any): void {
    const input = event.target;
    if (!input.files?.length) {
      return;
    }
    
    this.selectedFile = input.files[0];
    
    // Validar tamaño (10MB máximo)
    if (this.selectedFile && this.selectedFile.size > 10 * 1024 * 1024) {
      this.notificationService.warning('Archivo demasiado grande', { 
        description: 'La imagen no puede superar los 2MB'
      });
      this.selectedFile = null;
      input.value = '';
      return;
    }
    
    // Validar tipo
    if (this.selectedFile && !['image/jpeg', 'image/png', 'image/jpg'].includes(this.selectedFile.type)) {
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
      this.previewPortadaUrl = reader.result as string;
    };
    if (this.selectedFile) {
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Método público para acceder a la URL de la imagen desde la plantilla
   * @param path Ruta relativa de la imagen
   * @returns URL completa para acceder a la imagen
   */
  getImageUrl(path: string | null): string {
    if (!path) {
      return this.libroPlaceholder;
    }
    return this.librosService.getImageUrl(path);
  }
}
