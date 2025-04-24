import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioLibro } from '../../../models/usuario-libro/usuario-libro.model';
import { UsuarioLibroService } from '../../../core/services/usuario-libro.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';


@Component({
  selector: 'app-admin-usuario-libros',
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './admin-usuario-libros.component.html',
  styleUrl: './admin-usuario-libros.component.css'
})
export class AdminUsuarioLibrosComponent implements OnInit {
  // Array para almacenar todas las relaciones usuario-libro
  usuarioLibros: UsuarioLibro[] = [];
  // Relación actual que se está creando o editando
  currentUsuarioLibro: any = this.initializeUsuarioLibro();
  // Detalles de la relación seleccionada
  usuarioLibroDetalle: UsuarioLibro | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  
  // Propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Eliminar registro de lectura?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  usuarioLibroIdToDelete: number | null = null;

  constructor(
    private usuarioLibroService: UsuarioLibroService
  ) { }

  ngOnInit(): void {
    // Carga todas las relaciones al inicializar el componente
    this.getAllUsuarioLibros();
  }

  /**
   * Obtiene todas las relaciones usuario-libro del sistema
   */
  getAllUsuarioLibros(): void {
    this.usuarioLibroService.getAllUsuarioLibros().subscribe({
      next: (data) => {
        this.usuarioLibros = data;
      },
      error: (error) => {
        console.error('Error al cargar relaciones usuario-libro', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar las relaciones usuario-libro',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Obtiene una relación específica por su ID
   * @param id - ID de la relación a buscar
   */
  getUsuarioLibroById(id: number): void {
    this.usuarioLibroService.getUsuarioLibroById(id).subscribe({
      next: (usuarioLibro) => {
        this.usuarioLibroDetalle = usuarioLibro;
      },
      error: (error) => {
        console.error('Error al obtener detalles de la relación usuario-libro', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los detalles de la relación',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Prepara el formulario para crear una nueva relación
   */
  prepareCreateUsuarioLibro(): void {
    this.isEditing = false;
    this.currentUsuarioLibro = this.initializeUsuarioLibro();
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar una relación existente
   * @param usuarioLibro - Relación a editar
   */
  prepareUpdateUsuarioLibro(usuarioLibro: UsuarioLibro): void {
    this.isEditing = true;
    this.currentUsuarioLibro = { ...usuarioLibro };
    this.showForm = true;
  }

  /**
   * Determina si debe crear o actualizar una relación
   */
  saveUsuarioLibro(): void {
    if (this.isEditing) {
      this.updateUsuarioLibro();
    } else {
      this.createUsuarioLibro();
    }
  }

  /**
   * Envía la petición para crear una nueva relación
   */
  createUsuarioLibro(): void {
    this.usuarioLibroService.createUsuarioLibro(this.currentUsuarioLibro).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Relación usuario-libro creada correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllUsuarioLibros();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear relación usuario-libro', error);
        toast.error('Error', { 
          description: 'No se pudo crear la relación usuario-libro',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar una relación existente
   */
  updateUsuarioLibro(): void {
    this.usuarioLibroService.updateUsuarioLibro(this.currentUsuarioLibro.id, this.currentUsuarioLibro).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Relación usuario-libro actualizada correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllUsuarioLibros();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar relación usuario-libro', error);
        toast.error('Error', { 
          description: 'No se pudo actualizar la relación usuario-libro',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para eliminar una relación
   * @param id - ID de la relación a eliminar
   */
  deleteUsuarioLibro(id: number): void {
    this.usuarioLibroIdToDelete = id;
    this.showConfirmModal = true;
  }
  
  /**
   * Confirma la eliminación de la relación usuario-libro
   */
  confirmDeleteUsuarioLibro(): void {
    if (this.usuarioLibroIdToDelete) {
      this.usuarioLibroService.deleteUsuarioLibro(this.usuarioLibroIdToDelete).subscribe({
        next: () => {
          toast.success('Eliminada', { 
            description: 'La relación usuario-libro ha sido eliminada',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.getAllUsuarioLibros();
          this.usuarioLibroIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar relación usuario-libro', error);
          toast.error('Error', { 
            description: 'No se pudo eliminar la relación usuario-libro',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.usuarioLibroIdToDelete = null;
        }
      });
    }
  }
  
  /**
   * Cancela la eliminación de la relación usuario-libro
   */
  cancelDeleteUsuarioLibro(): void {
    this.usuarioLibroIdToDelete = null;
    console.log('Eliminación cancelada');
  }

  /**
   * Cancela la edición/creación de una relación
   */
  cancelEdit(): void {
    this.showForm = false;
    this.currentUsuarioLibro = this.initializeUsuarioLibro();
  }

  /**
   * Cierra el panel de detalles de la relación
   */
  closeDetails(): void {
    this.usuarioLibroDetalle = null;
  }

  /**
   * Formatea la fecha para mostrarla correctamente
   */
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  /**
   * Crea un objeto relación con valores por defecto
   */
  private initializeUsuarioLibro(): any {
    return {
      id: null,
      usuarioId: null,
      libroId: null,
      estadoLectura: 'LEYENDO', // Valores posibles: LEYENDO, TERMINADO, PENDIENTE, ABANDONADO
      valoracion: null,
      comentario: null,
      fechaInicioLectura: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      fechaFinLectura: null
    };
  }

  /**
   * Devuelve la fecha actual en formato ISO para usarla como valor máximo en inputs de tipo fecha
   */
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
