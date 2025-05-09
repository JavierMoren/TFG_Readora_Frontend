import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../models/role/role.model';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-roles',
  imports: [CommonModule, FormsModule],
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
  roleIdToDelete: number | null = null;
  
  // Propiedades para la paginación
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  // Exponer Math para usarlo en la plantilla
  Math = Math;

  constructor(
    private roleService: RoleService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getRolesPaginados();
  }

  /**
   * Obtiene los roles paginados mediante el servicio
   */
  getRolesPaginados(): void {
    this.roleService.getRolesPaginados(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data) => {
        this.roles = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
      },
      error: (error) => {
        console.error('Error al cargar roles paginados', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los roles'
        });
      }
    });
  }

  /**
   * Cambia a la página especificada
   * @param page - Número de página (0-based)
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getRolesPaginados();
    }
  }

  /**
   * Cambia el ordenamiento de los datos
   * @param sortBy - Campo por el que ordenar
   */
  changeSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      // Si ya está ordenando por este campo, cambia la dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0; // Vuelve a la primera página
    this.getRolesPaginados();
  }

  /**
   * Cambia el tamaño de página
   * @param size - Nuevo tamaño de página
   */
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Vuelve a la primera página
    this.getRolesPaginados();
  }

  /**
   * Obtiene todos los roles del sistema mediante el servicio
   * Método de respaldo que mantiene la compatibilidad con el código existente
   */
  getAllRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (error) => {
        console.error('Error al cargar roles', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los roles'
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
      next: (data) => {
        this.roleDetalle = data;
      },
      error: (error) => {
        console.error('Error al cargar rol', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo cargar el rol'
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
        this.notificationService.success('Éxito', { 
          description: 'Rol creado correctamente'
        });
        this.getRolesPaginados(); // Usar paginación en lugar de getAllRoles
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear rol', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo crear el rol'
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
        this.notificationService.success('Éxito', { 
          description: 'Rol actualizado correctamente'
        });
        this.getRolesPaginados(); // Usar paginación en lugar de getAllRoles
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar rol', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo actualizar el rol'
        });
      }
    });
  }

  /**
   * Envía la petición para eliminar un rol
   * @param id - ID del rol a eliminar
   */
  async deleteRole(id: number): Promise<void> {
    this.roleIdToDelete = id;
    
    const confirmed = await this.notificationService.confirm({
      title: '¿Eliminar rol?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (confirmed) {
      this.confirmDeleteRole();
    } else {
      this.roleIdToDelete = null;
    }
  }
  
  /**
   * Confirma la eliminación del rol
   */
  confirmDeleteRole(): void {
    if (this.roleIdToDelete !== null) {
      this.roleService.deleteRole(this.roleIdToDelete).subscribe({
        next: () => {
          this.notificationService.success('Eliminado', { 
            description: 'El rol ha sido eliminado correctamente'
          });
          this.getRolesPaginados(); // Usar paginación en lugar de getAllRoles
          this.roleIdToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar role', error);
          this.notificationService.error('Error', { 
            description: 'No se pudo eliminar el rol'
          });
          this.roleIdToDelete = null;
        }
      });
    }
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
