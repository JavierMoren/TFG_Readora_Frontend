import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Libro } from '../../../models/libro/libro.model';
import { LibrosService } from '../../../core/services/libros.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { AutorService } from '../../../core/services/autor.service';
import { Autor } from '../../../models/autor/autor.model';

@Component({
  selector: 'app-admin-libros',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './admin-libros.component.html',
  styleUrl: './admin-libros.component.css'
})
export class AdminLibrosComponent implements OnInit {
  // Array para almacenar todos los libros recuperados de la API
  libros: Libro[] = [];
  // Libro actual que se está creando o editando
  currentLibro: any = this.initializeLibro();
  // Almacena los detalles del libro seleccionado para ver
  libroDetalle: Libro | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  
  // Para manejar la carga de imágenes
  selectedFile: File | null = null;
  previewPortadaUrl: string | null = null;
  
  // Propiedades para la paginación
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  // Propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Eliminar libro?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  libroIdToDelete: number | null = null;

  // Para selector de autores
  allAutores: Autor[] = [];
  showAutorSelectorModal: boolean = false;
  selectedAutorId: number | null = null;

  constructor(
    public librosService: LibrosService,
    private autorService: AutorService
  ) { }

  ngOnInit(): void {
    // Carga los libros al inicializar el componente
    this.getAllLibrosPaginados();
    // Carga todos los autores para el selector
    this.loadAllAutores();
  }

  /**
   * Carga todos los autores disponibles para asociar
   */
  loadAllAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (autores) => {
        this.allAutores = autores;
      },
      error: (error) => {
        console.error('Error al cargar autores', error);
      }
    });
  }

  /**
   * Obtiene todos los libros del sistema de forma paginada
   */
  getAllLibrosPaginados(): void {
    this.librosService.getAllLibrosPaginados(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (data) => {
        this.libros = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
      },
      error: (error) => {
        console.error('Error al cargar libros', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los libros',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Obtiene todos los libros sin paginación (para casos específicos)
   */
  getAllLibros(): void {
    this.librosService.getAllLibros().subscribe({
      next: (data) => {
        this.libros = data;
      },
      error: (error) => {
        console.error('Error al cargar libros', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los libros',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Obtiene un libro específico por su ID
   * @param id - ID del libro a buscar
   */
  getLibroById(id: number): void {
    this.librosService.getLibroById(id).subscribe({
      next: (libro) => {
        this.libroDetalle = libro;
      },
      error: (error) => {
        console.error('Error al obtener detalles del libro', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los detalles del libro',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
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
    this.showForm = true;
    this.selectedFile = null;
    this.previewPortadaUrl = null;
  }

  /**
   * Prepara el formulario para editar un libro existente
   * @param libro - Libro a editar
   */
  prepareUpdateLibro(libro: Libro): void {
    this.isEditing = true;
    this.currentLibro = {
      id: libro.id,
      titulo: libro.titulo,
      isbn: libro.isbn, 
      editorial: libro.editorial,
      anioPublicacion: libro.anioPublicacion,
      genero: libro.genero,
      sinopsis: libro.sinopsis,
      numeroPaginas: libro.numeroPaginas,
      portadaUrl: libro.portadaUrl,
      autores: libro.autores || []
    };
    
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
    if (this.isEditing) {
      this.updateLibro();
    } else {
      this.createLibro();
    }
  }

  /**
   * Envía la petición para crear un nuevo libro
   */
  createLibro(): void {
    if (this.selectedFile) {
      // Si hay un archivo seleccionado, primero subimos la imagen
      this.uploadPortadaImagen().then(portadaUrl => {
        this.currentLibro.portadaUrl = portadaUrl; // Cambio: portada -> portadaUrl
        this.submitLibro(false);
      }).catch(error => {
        console.error('Error al subir la portada', error);
        toast.error('Error', { 
          description: 'No se pudo subir la imagen de portada',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      });
    } else {
      // Si no hay imagen, continuamos con la creación normal
      this.submitLibro(false);
    }
  }

  /**
   * Envía la petición para actualizar un libro existente
   */
  updateLibro(): void {
    if (this.selectedFile) {
      // Si hay un nuevo archivo seleccionado, primero subimos la imagen
      this.uploadPortadaImagen().then(portadaUrl => {
        this.currentLibro.portadaUrl = portadaUrl; // Cambio: portada -> portadaUrl
        this.submitLibro(true);
      }).catch(error => {
        console.error('Error al subir la portada', error);
        toast.error('Error', { 
          description: 'No se pudo subir la imagen de portada',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      });
    } else {
      // Si no hay nueva imagen, continuamos con la actualización normal
      this.submitLibro(true);
    }
  }

  /**
   * Envía la petición para eliminar un libro
   * @param id - ID del libro a eliminar
   */
  deleteLibro(id: number): void {
    this.libroIdToDelete = id;
    this.confirmModalTitle = '¿Eliminar libro?';
    this.confirmModalMessage = 'Esta acción no se puede deshacer';
    setTimeout(() => {
      this.showConfirmModal = true;
    }, 0);
  }
  
  /**
   * Confirma la eliminación del libro
   */
  confirmDeleteLibro(): void {
    if (this.libroIdToDelete) {
      this.librosService.deleteLibro(this.libroIdToDelete).subscribe({
        next: () => {
          toast.success('Eliminado', { 
            description: 'El libro ha sido eliminado',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.getAllLibrosPaginados();
          this.libroIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar libro', error);
          toast.error('Error', { 
            description: 'No se pudo eliminar el libro',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
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
    console.log('Eliminación cancelada');
  }

  /**
   * Cambia a una página específica en la paginación
   * @param page - Número de página a la que cambiar
   */
  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getAllLibrosPaginados();
    }
  }

  /**
   * Cambia el ordenamiento de los resultados
   * @param sort - Campo por el cual ordenar
   */
  changeSort(sort: string): void {
    if (this.sortBy === sort) {
      // Si ya está ordenado por este campo, cambia la dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sort;
      this.sortDirection = 'asc';
    }
    this.getAllLibrosPaginados();
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
   * Añade un autor al libro actual
   * @param autor - Autor a añadir
   */
  addAutor(autor: Autor): void {
    // Verificar que el autor no esté ya añadido
    if (!this.currentLibro.autores) {
      this.currentLibro.autores = [];
    }
    
    const autorExistente = this.currentLibro.autores.find((a: Autor) => a.id === autor.id);
    if (!autorExistente) {
      this.currentLibro.autores.push(autor);
      toast.success('Autor añadido', { 
        description: `${autor.nombre} ${autor.apellido} añadido como autor`,
      });
    } else {
      toast.error('Aviso', { 
        description: 'Este autor ya está asociado al libro',
      });
    }
    
    this.showAutorSelectorModal = false;
    this.selectedAutorId = null;
  }

  /**
   * Elimina un autor del libro actual
   * @param autor - Autor a eliminar
   */
  removeAutor(autor: Autor): void {
    if (this.currentLibro.autores) {
      this.currentLibro.autores = this.currentLibro.autores.filter((a: Autor) => a.id !== autor.id);
    }
  }

  /**
   * Crea un objeto libro con valores por defecto
   */
  private initializeLibro(): any {
    return {
      id: null,
      titulo: '',
      isbn: null,
      editorial: null,
      anioPublicacion: null,
      genero: null,
      sinopsis: null,
      numeroPaginas: null,
      portadaUrl: null, // Cambio: portada -> portadaUrl
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
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (2MB máximo)
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        toast.error('Error', { 
          description: 'La imagen no puede superar los 2MB',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        return;
      }
      
      // Validar tipo (solo imágenes)
      if (!file.type.startsWith('image/')) {
        toast.error('Error', { 
          description: 'El archivo debe ser una imagen',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        return;
      }
      
      this.selectedFile = file;
      
      // Crear una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.previewPortadaUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Sube la imagen de portada al servidor
   * @returns Promesa con la ruta relativa de la imagen
   */
  private uploadPortadaImagen(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        reject('No hay archivo seleccionado');
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      this.librosService.uploadPortadaImage(formData).subscribe({
        next: (response: any) => {
          // Usar 'path' (ruta relativa) en lugar de 'url' (URL completa)
          resolve(response.path);
        },
        error: (error) => {
          console.error('Error al subir la imagen', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Envía los datos del libro al servidor
   * @param isUpdate - Indica si es una actualización o creación
   */
  private submitLibro(isUpdate: boolean): void {
    const observable = isUpdate ? 
      this.librosService.updateLibro(this.currentLibro) : 
      this.librosService.createLibro(this.currentLibro);

    observable.subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: `Libro ${isUpdate ? 'actualizado' : 'creado'} correctamente`,
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllLibrosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        console.error(`Error al ${isUpdate ? 'actualizar' : 'crear'} libro`, error);
        toast.error('Error', { 
          description: `No se pudo ${isUpdate ? 'actualizar' : 'crear'} el libro`,
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }
}
