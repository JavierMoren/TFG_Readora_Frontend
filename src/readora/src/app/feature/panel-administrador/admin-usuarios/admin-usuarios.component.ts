import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../models/usuario/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { toast } from 'ngx-sonner';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';


@Component({
  selector: 'app-admin-usuarios',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmModalComponent],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.css'
})
export class AdminUsuariosComponent implements OnInit {
  // Array para almacenar todos los usuarios
  usuarios: Usuario[] = [];
  // Usuario actual que se está creando o editando
  currentUsuario: any = this.initializeUsuario();
  // Detalles del usuario seleccionado
  usuarioDetalle: Usuario | null = null;
  // Controla la visibilidad del formulario
  showForm: boolean = false;
  // Indica si estamos en modo edición
  isEditing: boolean = false;
  // Formulario reactivo
  usuarioForm!: FormGroup;
  // Variables para el cambio de contraseña
  cambiarContrasenna: boolean = false;
  passwordForm!: FormGroup;
  
  // Variables para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalTitle: string = '¿Estás seguro?';
  confirmModalMessage: string = 'Esta acción no se puede deshacer';
  userIdToDelete: number | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    console.log('AdminUsuariosComponent inicializado');
    // Carga todos los usuarios al inicializar el componente
    this.getAllUsuarios();
    // Inicializar formularios
    this.initForms();
  }

  /**
   * Inicializa los formularios reactivos
   */
  initForms(): void {
    // Formulario principal de usuario
    this.usuarioForm = this.fb.group({
      id: [null],
      usuario: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9_]{4,100}$')]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      gmail: ['', [Validators.required, Validators.pattern('[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$')]],
      contrasenna: [''],
      enabled: [true]
    });

    // Formulario para cambio de contraseña
    this.passwordForm = this.fb.group({
      contrasennaActual: ['', Validators.required],
      nuevaContrasenna: ['', [
        Validators.required,
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$')
      ]],
      confirmarContrasenna: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(formGroup: FormGroup) {
    const nuevaContrasenna = formGroup.get('nuevaContrasenna')?.value;
    const confirmarContrasenna = formGroup.get('confirmarContrasenna')?.value;
    if (nuevaContrasenna !== confirmarContrasenna) {
      formGroup.get('confirmarContrasenna')?.setErrors({ notMatch: true });
      return { notMatch: true };
    } else {
      formGroup.get('confirmarContrasenna')?.setErrors(null);
      return null;
    }
  }

  /**
   * Obtiene todos los usuarios del sistema mediante el servicio
   */
  getAllUsuarios(): void {
    console.log('Solicitando usuarios al servicio...');
    this.usuarioService.getAllUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los usuarios',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Obtiene un usuario específico por su ID
   * @param id - ID del usuario a buscar
   */
  getUsuarioById(id: number): void {
    console.log('Solicitando usuario con ID:', id);
    this.usuarioService.getUsuarioById(id).subscribe({
      next: (usuario) => {
        console.log('Usuario recibido:', usuario);
        this.usuarioDetalle = usuario;
      },
      error: (error) => {
        console.error('Error al obtener detalles del usuario', error);
        toast.error('Error', { 
          description: 'No se pudieron cargar los detalles del usuario',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Prepara el formulario para crear un nuevo usuario
   */
  prepareCreateUsuario(): void {
    console.log('Preparando formulario para crear usuario');
    this.isEditing = false;
    this.resetForms();
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un usuario existente
   * @param usuario - Usuario a editar
   */
  prepareUpdateUsuario(usuario: Usuario): void {
    console.log('Preparando formulario para actualizar usuario:', usuario);
    this.isEditing = true;
    // Establecer valores en el formulario
    this.usuarioForm.patchValue({
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      gmail: usuario.gmail,
      enabled: usuario.enabled
    });
    // Resetear campos de contraseña
    this.cambiarContrasenna = false;
    this.resetPasswordForm();
    this.showForm = true;
  }

  /**
   * Resetea los formularios a sus valores iniciales
   */
  resetForms(): void {
    this.usuarioForm.reset({
      id: null,
      usuario: '',
      nombre: '',
      apellido: '',
      gmail: '',
      contrasenna: '',
      enabled: true
    });
    this.resetPasswordForm();
  }

  /**
   * Resetea el formulario de cambio de contraseña
   */
  resetPasswordForm(): void {
    this.passwordForm.reset({
      contrasennaActual: '',
      nuevaContrasenna: '',
      confirmarContrasenna: ''
    });
  }

  /**
   * Determina si debe crear o actualizar un usuario
   */
  saveUsuario(): void {
    if (!this.usuarioForm.valid || (this.cambiarContrasenna && !this.passwordForm.valid)) {
      this.usuarioForm.markAllAsTouched();
      if (this.cambiarContrasenna) {
        this.passwordForm.markAllAsTouched();
      }
      return;
    }
    console.log('Guardando usuario en modo:', this.isEditing ? 'edición' : 'creación');
    this.currentUsuario = this.usuarioForm.value;
    if (this.isEditing) {
      this.updateUsuario();
    } else {
      this.createUsuario();
    }
  }

  /**
   * Envía la petición para crear un nuevo usuario
   */
  createUsuario(): void {
    console.log('Creando nuevo usuario...');
    this.usuarioService.createUsuario(this.currentUsuario).subscribe({
      next: (response) => {
        console.log('Usuario creado:', response);
        toast.success('Éxito', { 
          description: 'Usuario creado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllUsuarios();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al crear usuario', error);
        toast.error('Error', { 
          description: 'No se pudo crear el usuario',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar un usuario existente
   */
  updateUsuario(): void {
    console.log('Actualizando usuario...');
    // Si se está cambiando la contraseña, verificamos primero
    if (this.cambiarContrasenna) {
      this.verificarContrasenna();
    } else {
      // Si no cambiamos contraseña, enviamos la actualización directamente
      this.enviarActualizacion();
    }
  }

  /**
   * Verifica la contraseña actual antes de permitir el cambio
   */
  verificarContrasenna(): void {
    // Crear un objeto con el usuario y contraseña para validar
    const credenciales = {
      usuario: this.currentUsuario.usuario,
      contrasenna: this.passwordForm.value.contrasennaActual
    };
    this.usuarioService.verificarContrasenna(credenciales).subscribe({
      next: (resultado) => {
        if (resultado.valida) {
          // Si la contraseña es correcta, procedemos con la actualización
          // Guardamos la nueva contraseña en el objeto de usuario para que el backend la cifre
          this.currentUsuario.contrasenna = this.passwordForm.value.nuevaContrasenna;
          this.enviarActualizacion();
        } else {
          toast.error('Error', { 
            description: 'La contraseña actual no es correcta',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        }
      },
      error: (error) => {
        console.error('Error al verificar contraseña', error);
        toast.error('Error', { 
          description: 'No se pudo verificar la contraseña',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la solicitud de actualización al servidor
   */
  enviarActualizacion(): void {
    this.currentUsuario.enabled = !!this.currentUsuario.enabled;
    this.usuarioService.updateUsuario(this.currentUsuario).subscribe({
      next: (response) => {
        console.log('Usuario actualizado:', response);
        toast.success('Éxito', { 
          description: 'Usuario actualizado correctamente',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        this.getAllUsuarios();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error al actualizar usuario', error);
        toast.error('Error', { 
          description: 'No se pudo actualizar el usuario',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
      }
    });
  }

  /**
   * Envía la petición para eliminar un usuario
   * @param id - ID del usuario a eliminar
   */
  deleteUsuario(id: number): void {
    this.userIdToDelete = id;
    this.confirmModalTitle = '¿Eliminar usuario?';
    this.confirmModalMessage = 'Esta acción no se puede deshacer';
    setTimeout(() => {
      this.showConfirmModal = true;
    }, 0);
  }

  /**
   * Método que se ejecuta cuando se confirma la eliminación en el modal
   */
  confirmDelete(): void {
    if (this.userIdToDelete !== null) {
      console.log('Confirmación recibida, eliminando usuario...');
      this.usuarioService.deleteUsuario(this.userIdToDelete).subscribe({
        next: () => {
          console.log('Usuario eliminado con éxito');
          toast.success('Eliminado', { 
            description: 'El usuario ha sido eliminado',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          this.getAllUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario', error);
          toast.error('Error', { 
            description: 'No se pudo eliminar el usuario',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        }
      });
      // Resetear el ID del usuario a eliminar
      this.userIdToDelete = null;
    }
  }

  /**
   * Método que se ejecuta cuando se cancela la eliminación en el modal
   */
  cancelDelete(): void {
    console.log('Eliminación cancelada');
    this.userIdToDelete = null;
  }

  /**
   * Cancela la edición/creación de un usuario
   */
  cancelEdit(): void {
    console.log('Cancelando edición de usuario');
    this.showForm = false;
    this.resetForms();
  }

  /**
   * Cierra el panel de detalles del usuario
   */
  closeDetails(): void {
    console.log('Cerrando detalles del usuario');
    this.usuarioDetalle = null;
  }

  /**
   * Crea un objeto usuario con valores por defecto
   */
  private initializeUsuario(): any {
    return {
      id: null,
      usuario: '',
      nombre: '',
      apellido: '',
      gmail: '',
      contrasenna: '',
      enabled: true
    };
  }
}