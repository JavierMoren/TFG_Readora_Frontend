import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Libro } from '../../../models/libro/libro.model';
import { LibrosService } from '../../../core/services/libros.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

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

  constructor(
    private librosService: LibrosService
  ) { }

  ngOnInit(): void {
    // Carga los libros al inicializar el componente
    this.getAllLibrosPaginados();
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
      portada: libro.portada,
      autores: libro.autores
    };
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
    this.librosService.createLibro(this.currentLibro).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Libro creado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllLibrosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear libro', error);
        toast.error('Error', { 
          description: 'No se pudo crear el libro',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar un libro existente
   */
  updateLibro(): void {
    this.librosService.updateLibro(this.currentLibro).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Libro actualizado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllLibrosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar libro', error);
        toast.error('Error', { 
          description: 'No se pudo actualizar el libro',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
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
  }

  /**
   * Cierra el panel de detalles del libro
   */
  closeDetails(): void {
    this.libroDetalle = null;
  }

  /**
   * Crea un objeto libro con valores por defecto
   */
  private initializeLibro(): any {
    return {
      id: null,
      titulo: '',
      ISBN: null,
      editorial: null,
      anioPublicacion: null,
      genero: null,
      portada: null,
      autores: []
    };
  }

  /**
   * Devuelve la fecha actual en formato ISO para usarla como valor máximo en inputs de tipo fecha
   */
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
