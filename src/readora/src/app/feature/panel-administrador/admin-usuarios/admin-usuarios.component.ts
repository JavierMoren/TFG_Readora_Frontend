import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, first, catchError, switchMap } from 'rxjs/operators';
import { Usuario } from '../../../models/usuario/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-usuarios',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.css'
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  currentUsuario: any = this.initializeUsuario();
  usuarioDetalle: Usuario | null = null;
  showForm: boolean = false;
  isEditing: boolean = false;
  usuarioForm!: FormGroup;
  cambiarContrasenna: boolean = false;
  passwordForm!: FormGroup;
  esUsuarioGoogle: boolean = false;
  
  userIdToDelete: number | null = null;
  
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  Math = Math;

  // Nuevas variables para control de estado de validación
  usuarioValido = false;
  gmailValido = false;
  formularioEnviado = false;

  // Variables para control de estado de validación
  usuarioVerificandose = false;
  gmailVerificandose = false;

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Inicializar formularios
    this.initForms();
    // Carga los usuarios paginados al inicializar el componente
    this.getUsuariosPaginados();
  }

  /**
   * Obtiene los usuarios paginados mediante el servicio
   */
  getUsuariosPaginados(): void {
    this.usuarioService.getUsuariosPaginados(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (data) => {
        this.usuarios = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los usuarios'
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
      this.getUsuariosPaginados();
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
    this.getUsuariosPaginados();
  }

  /**
   * Cambia el tamaño de página
   * @param size - Nuevo tamaño de página
   */
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Vuelve a la primera página
    this.getUsuariosPaginados();
  }

  /**
   * Inicializa los formularios reactivos
   */
  initForms(): void {
    // Formulario principal de usuario
    this.usuarioForm = this.fb.group({
      id: [null],
      usuario: ['', {
        validators: [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(100),
          Validators.pattern('^[a-zA-Z0-9._-]+$')
        ],
        asyncValidators: [this.usuarioUnicoValidator()],
        updateOn: 'blur'
      }],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      gmail: ['', {
        validators: [Validators.required, Validators.pattern('[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$')],
        asyncValidators: [this.emailUnicoValidator()],
        updateOn: 'blur'
      }],
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
  
  
  // Validador asíncrono para comprobar si el usuario ya existe
  usuarioUnicoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        this.usuarioValido = false;
        return of(null);
      }

      // Si estamos editando y el usuario no ha cambiado, no validar
      if (this.isEditing && this.currentUsuario.usuario === control.value) {
        this.usuarioValido = true;
        return of(null);
      }

      this.usuarioVerificandose = true;
      this.usuarioValido = false;
      
      return of(control.value).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string) => this.usuarioService.checkUsuarioExiste(value)),
        map(existe => {
          this.usuarioVerificandose = false;
          this.usuarioValido = !existe;
          return existe ? { usuarioExistente: true } : null;
        }),
        first(),
        catchError(error => {
          this.usuarioVerificandose = false;
          this.usuarioValido = false;
          return of(null);
        })
      );
    };
  }

  // Validador asíncrono para comprobar si el email ya existe
  emailUnicoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        this.gmailValido = false;
        return of(null);
      }

      // Si estamos editando y el email no ha cambiado, no validar
      if (this.isEditing && this.currentUsuario.gmail === control.value) {
        this.gmailValido = true;
        return of(null);
      }

      this.gmailVerificandose = true;
      this.gmailValido = false;
      
      return this.usuarioService.checkEmailExiste(control.value).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map(existe => {
          this.gmailVerificandose = false;
          this.gmailValido = !existe;
          return existe ? { gmailExistente: true } : null;
        }),
        first(),
        catchError((error) => {
          this.gmailVerificandose = false;
          this.gmailValido = false;
          return of(null);
        })
      );
    };
  }

  /**
   * Obtiene todos los usuarios del sistema mediante el servicio
   * Método de respaldo que mantiene la compatibilidad con el código existente
   */
  getAllUsuarios(): void {
    this.usuarioService.getAllUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los usuarios'
        });
      }
    });
  }

  /**
   * Obtiene un usuario específico por su ID
   * @param id - ID del usuario a buscar
   */
  getUsuarioById(id: number): void {
    this.usuarioService.getUsuarioById(id).subscribe({
      next: (data) => {
        this.usuarioDetalle = data;
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudo cargar el usuario'
        });
      }
    });
  }

  /**
   * Prepara el formulario para crear un nuevo usuario
   */
  prepareCreateUsuario(): void {
    this.isEditing = false;
    this.formularioEnviado = false;
    this.resetForms();
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un usuario existente
   * @param usuario - Usuario a editar
   */
  prepareUpdateUsuario(usuario: Usuario): void {
    this.isEditing = true; 
    this.formularioEnviado = false;
    // Asignar el usuario actual para que los validadores asíncronos funcionen correctamente
    this.currentUsuario = { ...usuario };
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
    this.formularioEnviado = true; // Marcar el formulario como enviado
    
    if (this.usuarioForm.valid) {
      this.currentUsuario = this.usuarioForm.value;
      
      if (this.isEditing) {
        // Si está editando y quiere cambiar la contraseña
        if (this.cambiarContrasenna) {
          if (this.passwordForm.valid) {
            this.verificarContrasenna();
          } else {
            this.notificationService.warning('Validación', {
              description: 'Verifica los campos de contraseña'
            });
          }
        } else {
          // Edición normal sin cambio de contraseña
          this.updateUsuario();
        }
      } else {
        // Creación de nuevo usuario
        this.createUsuario();
      }
    } else {
      this.notificationService.warning('Validación', {
        description: 'Por favor, completa correctamente el formulario'
      });
    }
  }

  /**
   * Envía la petición para crear un nuevo usuario
   */
  createUsuario(): void {
    this.usuarioService.adminCreateUsuario(this.currentUsuario).subscribe({
      next: (response) => {
        this.notificationService.success('Éxito', { 
          description: 'Usuario creado correctamente'
        });
        this.getUsuariosPaginados(); // Usar paginación en lugar de getAllUsuarios
        this.cancelEdit();
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudo crear el usuario'
        });
      }
    });
  }

  /**
   * Envía la petición para actualizar un usuario existente
   */
  updateUsuario(): void {
    // Si es una cuenta de Google y los valores han cambiado, restauramos los originales
    if (this.esUsuarioGoogle) {
      // Obtener el usuario original para restaurar usuario y email
      this.usuarioService.getUsuarioById(this.currentUsuario.id).subscribe({
        next: (usuarioOriginal) => {
          // Restaurar valores que no se deberían cambiar en cuentas de Google
          this.currentUsuario.usuario = usuarioOriginal.usuario;
          this.currentUsuario.gmail = usuarioOriginal.gmail;
          
          // Continuar con la actualización usando los valores restaurados
          this.enviarActualizacionUsuario();
        },
        error: (error) => {
          this.notificationService.error('Error', { 
            description: 'No se pudo verificar la información original del usuario de Google'
          });
        }
      });
    } else {
      // Usuario normal, proceder con la actualización directamente
      this.enviarActualizacionUsuario();
    }
  }
  
  /**
   * Método auxiliar que envía la petición de actualización al servidor
   */
  private enviarActualizacionUsuario(): void {
    this.usuarioService.adminUpdateUsuario(this.currentUsuario).subscribe({
      next: (response) => {
        this.notificationService.success('Éxito', { 
          description: 'Usuario actualizado correctamente'
        });
        this.getUsuariosPaginados();
        this.cancelEdit();
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudo actualizar el usuario'
        });
      }
    });
  }

  /**
   * Verifica la contraseña actual antes de permitir el cambio
   */
  verificarContrasenna(): void {
    
    const verificacionData = {
      usuario: this.usuarioForm.value.usuario, // Usar el nombre de usuario en lugar del ID
      contrasenna: this.passwordForm.value.contrasennaActual
    };
    
    this.usuarioService.verificarContrasenna(verificacionData).subscribe({
      next: (response) => {
        if (response.valida) { // Cambiar de response.valid a response.valida según la interfaz del servicio
          // Mostrar notificación de éxito en la verificación
          this.notificationService.success('Verificación exitosa', {
            description: 'La contraseña actual es correcta'
          });
          // Actualizar el objeto con la nueva contraseña
          this.currentUsuario.contrasenna = this.passwordForm.value.nuevaContrasenna;
          this.enviarActualizacion();
        } else {
          this.notificationService.error('Error', { 
            description: 'La contraseña actual no es correcta'
          });
        }
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudo verificar la contraseña'
        });
      }
    });
  }

  /**
   * Envía la solicitud de actualización al servidor
   */
  enviarActualizacion(): void {
    // No permitir cambiar la contraseña si es un usuario de Google
    if (this.esUsuarioGoogle) {
      this.notificationService.error('Error', {
        description: 'No se puede cambiar la contraseña de un usuario autenticado con Google'
      });
      return;
    }
    
    this.usuarioService.updateUsuarioConPassword(this.currentUsuario).subscribe({
      next: (response) => {
        this.notificationService.success('Éxito', { 
          description: 'Usuario y contraseña actualizados correctamente'
        });
        this.getUsuariosPaginados(); // Usar paginación en lugar de getAllUsuarios
        this.cancelEdit();
      },
      error: (error) => {
        this.notificationService.error('Error', { 
          description: 'No se pudo actualizar la contraseña'
        });
      }
    });
  }
  
  /**
   * Verifica si el usuario puede cambiar su contraseña
   * @returns boolean indicando si se permite cambiar la contraseña
   */
  puedeModificarContrasenna(): boolean {
    return !this.esUsuarioGoogle;
  }

  /**
   * Envía la petición para eliminar un usuario
   * @param id - ID del usuario a eliminar
   */
  async deleteUsuario(id: number): Promise<void> {
    this.userIdToDelete = id;
    
    const confirmed = await this.notificationService.confirm({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (confirmed) {
      this.confirmDelete();
    } else {
      this.userIdToDelete = null;
    }
  }

  /**
   * Método que se ejecuta cuando se confirma la eliminación en el modal
   */
  confirmDelete(): void {
    if (this.userIdToDelete !== null) {
      this.usuarioService.adminDeleteUsuario(this.userIdToDelete).subscribe({
        next: () => {
          this.notificationService.success('Eliminado', { 
            description: 'El usuario ha sido eliminado'
          });
          this.getUsuariosPaginados();
        },
        error: (error) => {
          if (error.status === 409) {
            this.notificationService.warning('No se puede eliminar', { 
              description: 'Este usuario tiene libros asociados en su biblioteca personal. Debe eliminar primero los libros de la biblioteca del usuario.'
            });
          } else {
            this.notificationService.error('Error', { 
              description: 'No se pudo eliminar el usuario'
            });
          }
        }
      });
      this.userIdToDelete = null;
    }
  }

  /**
   * Cancela la edición/creación de un usuario
   */
  cancelEdit(): void {
    this.showForm = false;
    this.formularioEnviado = false;
    this.resetForms();
  }

  /**
   * Cierra el panel de detalles del usuario
   */
  closeDetails(): void {
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