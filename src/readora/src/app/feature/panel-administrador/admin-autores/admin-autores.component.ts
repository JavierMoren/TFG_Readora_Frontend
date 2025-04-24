import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Autor } from '../../../models/autor/autor.model';
import { AutorService } from '../../../core/services/autor.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';


@Component({
  selector: 'app-admin-autores',
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './admin-autores.component.html',
  styleUrl: './admin-autores.component.css'
})
export class AdminAutoresComponent implements OnInit {
  // Array para almacenar todos los autores
  autores: Autor[] = [];
  // Autor actual que se está creando o editando
  currentAutor: any = this.initializeAutor();
  // Detalles del autor seleccionado
  autorDetalle: Autor | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;

  // Propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Eliminar Autor?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  autorIdToDelete: number | null = null;

  constructor(
    private autorService: AutorService
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
   * Prepara el formulario para crear un nuevo autor
   */
  prepareCreateAutor(): void {
    this.isEditing = false;
    this.currentAutor = this.initializeAutor();
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un autor existente
   * @param autor - Autor a editar
   */
  prepareUpdateAutor(autor: Autor): void {
    this.isEditing = true;
    this.currentAutor = { ...autor };
    this.showForm = true;
  }

  /**
   * Determina si debe crear o actualizar un autor
   */
  saveAutor(): void {
    if (this.isEditing) {
      this.updateAutor();
    } else {
      this.createAutor();
    }
  }

  /**
   * Envía la petición para crear un nuevo autor
   */
  createAutor(): void {
    this.autorService.createAutor(this.currentAutor).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Autor creado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllAutores();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear autor', error);
        toast.error('Error', { 
          description: 'No se pudo crear el autor',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar un autor existente
   */
  updateAutor(): void {
    this.autorService.updateAutor(this.currentAutor).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Autor actualizado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllAutores();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar autor', error);
        toast.error('Error', { 
          description: 'No se pudo actualizar el autor',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
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
  }

  /**
   * Cierra el panel de detalles del autor
   */
  closeDetails(): void {
    this.autorDetalle = null;
  }

  /**
   * Crea un objeto autor con valores por defecto
   */
  private initializeAutor(): any {
    return {
      id: null,
      nombre: '',
      apellido: ''
    };
  }
}