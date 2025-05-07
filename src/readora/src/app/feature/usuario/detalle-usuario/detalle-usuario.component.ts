import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { Usuario } from '../../../models/usuario/usuario.model';

@Component({
  selector: 'app-detalle-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './detalle-usuario.component.html',
  styleUrl: './detalle-usuario.component.css'
})
export class DetalleUsuarioComponent implements OnInit {
  usuarioForm!: FormGroup;
  passwordForm!: FormGroup;
  
  cambiarContrasenna: boolean = false;
  usuario: Usuario | null = null;
  cargando: boolean = true;
  errorCarga: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private autenticacionService: AutenticacionService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarDatosUsuario();
  }

  /**
   * Inicializa los formularios reactivos
   */
  inicializarFormularios(): void {
    this.usuarioForm = this.fb.group({
      id: [null],
      usuario: [{value: '', disabled: true}], // Nombre de usuario no editable
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      gmail: ['', [Validators.required, Validators.pattern('[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$')]]
    });

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
   * Carga los datos del usuario autenticado
   */
  cargarDatosUsuario(): void {
    this.cargando = true;
    this.autenticacionService.getUserInfo().subscribe({
      next: (userData) => {
        if (userData && userData.id) {
          this.usuarioService.getUsuarioById(userData.id).subscribe({
            next: (usuario) => {
              this.usuario = usuario;
              this.usuarioForm.patchValue({
                id: usuario.id,
                usuario: usuario.usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                gmail: usuario.gmail
              });
              this.cargando = false;
            },
            error: (error) => {
              console.error('Error al obtener datos del usuario', error);
              this.errorCarga = true;
              this.cargando = false;
              this.notificationService.error('Error', { 
                description: 'No se pudieron cargar los datos del usuario'
              });
            }
          });
        } else {
          this.errorCarga = true;
          this.cargando = false;
          this.notificationService.error('Error', { 
            description: 'No se pudo identificar al usuario actual'
          });
        }
      },
      error: (error) => {
        console.error('Error al verificar usuario autenticado', error);
        this.errorCarga = true;
        this.cargando = false;
        this.notificationService.error('Error', { 
          description: 'Error de autenticación'
        });
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Guarda los cambios en el perfil del usuario
   */
  guardarCambios(): void {
    if (this.usuarioForm.valid && this.usuario) {
      // Obtenemos los valores del formulario
      const formValues = this.usuarioForm.getRawValue();
      
      // Creamos un objeto Usuario completo con todos los campos requeridos
      const usuarioActualizado: Usuario = {
        id: this.usuario.id,
        usuario: this.usuario.usuario,
        nombre: formValues.nombre,
        apellido: formValues.apellido,
        gmail: formValues.gmail,
        contrasenna: this.usuario.contrasenna, // Mantener la contraseña existente
        enabled: this.usuario.enabled,
        fechaCreacion: this.usuario.fechaCreacion
      };

      this.usuarioService.updateUsuario(usuarioActualizado).subscribe({
        next: () => {
          this.notificationService.success('Éxito', { 
            description: 'Datos actualizados correctamente'
          });
        },
        error: (error) => {
          console.error('Error al actualizar datos del usuario', error);
          this.notificationService.error('Error', { 
            description: 'No se pudieron actualizar los datos'
          });
        }
      });
    } else {
      this.notificationService.warning('Validación', {
        description: 'Por favor, completa correctamente el formulario'
      });
    }
  }

  /**
   * Verifica la contraseña actual antes de permitir el cambio
   */
  verificarContrasenna(): void {
    if (!this.passwordForm.valid) {
      this.notificationService.warning('Validación', {
        description: 'Por favor, completa correctamente todos los campos'
      });
      return;
    }
    
    // Verificar que el usuario existe
    if (!this.usuario || !this.usuario.usuario) {
      this.notificationService.error('Error', { 
        description: 'No se pudo identificar al usuario actual'
      });
      return;
    }
    
    // Asegurarse de que estamos verificando la contraseña del usuario actual
    const verificacionData = {
      usuario: this.usuario.usuario,
      contrasenna: this.passwordForm.value.contrasennaActual
    };
    
    console.log('Verificando contraseña para usuario:', this.usuario.usuario);
    
    // Deshabilitamos temporalmente los controles para evitar múltiples envíos
    this.passwordForm.disable();
    
    // Usar directamente SweetAlert2 sin pasar por el servicio de notificación
    // para evitar conflictos con otros diálogos
    this.usuarioService.verificarContrasenna(verificacionData).subscribe({
      next: (response) => {
        // Reactivamos los controles
        this.passwordForm.enable();
        
        if (response.valida) {
          // Crear una copia completa del usuario con todos los campos requeridos
          const usuarioConNuevaContrasenna: Usuario = {
            id: this.usuario!.id,
            usuario: this.usuario!.usuario,
            nombre: this.usuario!.nombre,
            apellido: this.usuario!.apellido,
            gmail: this.usuario!.gmail,
            contrasenna: this.passwordForm.value.nuevaContrasenna,
            enabled: this.usuario!.enabled,
            fechaCreacion: this.usuario!.fechaCreacion
          };
          
          // Actualizar sin pasar por el servicio de notificación para evitar conflictos
          this.usuarioService.updateUsuarioConPassword(usuarioConNuevaContrasenna).subscribe({
            next: (usuarioActualizado) => {
              // Actualizar el usuario en el estado del componente
              this.usuario = usuarioActualizado;
              
              // Usar una notificación de tipo toast en lugar de un modal
              this.notificationService.success('Éxito', { 
                description: 'Contraseña actualizada correctamente'
              });
              
              this.cambiarContrasenna = false;
              this.resetPasswordForm();
            },
            error: (error: any) => {
              console.error('Error al actualizar contraseña', error);
              this.notificationService.error('Error', { 
                description: 'No se pudo actualizar la contraseña'
              });
            }
          });
        } else {
          this.notificationService.error('Error', { 
            description: 'La contraseña actual no es correcta'
          });
        }
      },
      error: (error) => {
        // Reactivamos los controles en caso de error
        this.passwordForm.enable();
        
        console.error('Error al verificar contraseña', error);
        this.notificationService.error('Error', { 
          description: 'No se pudo verificar la contraseña'
        });
      }
    });
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
   * Cancela el cambio de contraseña
   */
  cancelarCambioContrasenna(): void {
    this.cambiarContrasenna = false;
    this.resetPasswordForm();
  }
}
