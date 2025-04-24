import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../models/role/role.model';
import { RoleService } from '../../../core/services/role.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-roles',
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.css'
})
export class AdminRolesComponent implements OnInit {
  // Array para almacenar todos los roles
  roles: Role[] = [];
  // Role actual que se está creando o editando
  currentRole: any = this.initializeRole();
  // Detalles del role seleccionado
  roleDetalle: Role | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  
  // Propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Eliminar rol?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  roleIdToDelete: number | null = null;

  constructor(
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    // Carga todos los roles al inicializar el componente
    this.getAllRoles();
  }

  /**
   * Obtiene todos los roles del sistema mediante el servicio
   */
  getAllRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (error) => {
        console.error('Error al cargar roles', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los roles',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Obtiene un rol específico por su ID
   * @param id - ID del rol a buscar
   */
  getRoleById(id: number): void {
    this.roleService.getRoleById(id).subscribe({
      next: (role) => {
        this.roleDetalle = role;
      },
      error: (error) => {
        console.error('Error al obtener detalles del rol', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los detalles del rol',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Prepara el formulario para crear un nuevo rol
   */
  prepareCreateRole(): void {
    this.isEditing = false;
    this.currentRole = this.initializeRole();
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un rol existente
   * @param role - Rol a editar
   */
  prepareUpdateRole(role: Role): void {
    this.isEditing = true;
    this.currentRole = { ...role };
    this.showForm = true;
  }

  /**
   * Determina si debe crear o actualizar un rol
   */
  saveRole(): void {
    if (this.isEditing) {
      this.updateRole();
    } else {
      this.createRole();
    }
  }

  /**
   * Envía la petición para crear un nuevo rol
   */
  createRole(): void {
    this.roleService.createRole(this.currentRole).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Rol creado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllRoles();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear rol', error);
        toast.error('Error', { 
          description: 'No se pudo crear el rol',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar un rol existente
   */
  updateRole(): void {
    this.roleService.updateRole(this.currentRole).subscribe({
      next: (response) => {
        toast.success('Éxito', { 
          description: 'Rol actualizado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllRoles();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar rol', error);
        toast.error('Error', { 
          description: 'No se pudo actualizar el rol',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para eliminar un rol
   * @param id - ID del rol a eliminar
   */
  deleteRole(id: number): void {
    this.roleIdToDelete = id;
    this.showConfirmModal = true;
  }
  
  /**
   * Confirma la eliminación del rol
   */
  confirmDeleteRole(): void {
    if (this.roleIdToDelete) {
      this.roleService.deleteRole(this.roleIdToDelete).subscribe({
        next: () => {
          toast.success('Éxito', { 
            description: 'Rol eliminado correctamente',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.getAllRoles();
          this.roleIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar rol', error);
          toast.error('Error', { 
            description: 'No se pudo eliminar el rol',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.roleIdToDelete = null;
        }
      });
    }
  }
  
  /**
   * Cancela la eliminación del rol
   */
  cancelDeleteRole(): void {
    this.roleIdToDelete = null;
    console.log('Eliminación cancelada');
  }

  /**
   * Cancela la edición/creación de un rol
   */
  cancelEdit(): void {
    this.showForm = false;
    this.currentRole = this.initializeRole();
  }

  /**
   * Cierra el panel de detalles del rol
   */
  closeDetails(): void {
    this.roleDetalle = null;
  }

  /**
   * Crea un objeto rol con valores por defecto
   */
  private initializeRole(): any {
    return {
      id: null,
      nombre: ''
    };
  }
}
