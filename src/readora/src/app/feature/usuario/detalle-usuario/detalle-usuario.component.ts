import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AutenticacionService } from '../../../core/services/autenticacion.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { Usuario } from '../../../models/usuario/usuario.model';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, first, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-detalle-usuario',
  
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
  modoEdicion: boolean = false; // Controla si los campos están en modo edición o no
  esUsuarioGoogle: boolean = false; // Controla si el usuario se ha autenticado con Google

  // Variables para indicadores de validación asíncrona
  usuarioVerificandose: boolean = false;
  gmailVerificandose: boolean = false;
  
  // Variables para mejorar el control de validación
  usuarioValido: boolean = false;
  gmailValido: boolean = false;
  formularioEnviado: boolean = false;

  // Añadimos una variable userData para guardar la respuesta original del backend
  userData: any = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly usuarioService: UsuarioService,
    private readonly autenticacionService: AutenticacionService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
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
        validators: [
          Validators.required, 
          Validators.pattern('[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$')
        ],
        asyncValidators: [this.emailUnicoValidator()],
        updateOn: 'blur'
      }]
    });

    this.passwordForm = this.fb.group({
      contrasennaActual: ['', Validators.required],
      nuevaContrasenna: ['', [
        Validators.required,
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$')
      ]],
      confirmarContrasenna: ['', Validators.required]
    });
    
    // Aplicar validador de coincidencia de contraseñas de forma manual
    this.passwordForm.valueChanges.subscribe(() => {
      const nuevaContrasenna = this.passwordForm.get('nuevaContrasenna')?.value;
      const confirmarContrasenna = this.passwordForm.get('confirmarContrasenna')?.value;
      
      if (confirmarContrasenna && nuevaContrasenna !== confirmarContrasenna) {
        this.passwordForm.get('confirmarContrasenna')?.setErrors({ notMatch: true });
      }
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
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
   * Validador asíncrono para verificar que el nombre de usuario sea único
   */
  usuarioUnicoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        this.usuarioValido = false;
        return of(null);
      }

      // Si estamos editando y el username no ha cambiado, no validar
      if (this.usuario && this.usuario.usuario === control.value) {
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
          console.error(`[DetalleUsuario] Error al validar usuario "${control.value}"`, error);
          this.usuarioVerificandose = false;
          this.usuarioValido = false;
          return of(null);
        })
      );
    };
  }

  /**
   * Validador asíncrono para verificar que el email sea único
   */
  emailUnicoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        this.gmailValido = false;
        return of(null);
      }

      // Si estamos editando y el email no ha cambiado, no validar
      if (this.usuario && this.usuario.gmail === control.value) {
        this.gmailValido = true;
        return of(null);
      }

      // Si es usuario de Google, no validar ya que el campo está deshabilitado
      if (this.esUsuarioGoogle) {
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
        catchError(() => {
          this.gmailVerificandose = false;
          this.gmailValido = false;
          return of(null);
        })
      );
    };
  }

  /**
   * Carga los datos del usuario autenticado
   */
  cargarDatosUsuario(): void {
    this.cargando = true;
    this.autenticacionService.getUserInfo().subscribe({
      next: (userData: any) => {
        // Guardamos la respuesta completa del backend
        this.userData = userData;
        if (userData?.id) {
          this.usuarioService.getUsuarioById(userData.id).subscribe({
            next: (usuario) => {
              this.usuario = usuario;
              
              // Usar el método centralizado para detectar si es usuario de Google
              this.detectarUsuarioGoogle();
              
              // Al cargar datos, el campo usuario también se rellena y se habilita
              this.usuarioForm.patchValue({
                id: usuario.id,
                usuario: usuario.usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                gmail: usuario.gmail
              });
              this.cargando = false;
            },
      error: (error: any) => {
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
    // Marcar el formulario como enviado
    this.formularioEnviado = true;
    
    // Verificar nuevamente si es usuario de Google
    this.detectarUsuarioGoogle();
    
    if (this.usuarioForm.valid && this.usuario) {
      
      // Obtenemos los valores del formulario
      const formValues = this.usuarioForm.getRawValue();
      
      // PROTECCIÓN PARA USUARIOS DE GOOGLE
      // Para usuarios de Google, asegurarnos que no se modifique el email
      if (this.esUsuarioGoogle) {
        // Restaurar valor original para email si es usuario Google
        formValues.gmail = this.usuario.gmail;
      }
      
      // Creamos un objeto Usuario completo con todos los campos requeridos
      const usuarioActualizado: Usuario = {
        id: this.usuario.id,
        usuario: formValues.usuario,
        nombre: formValues.nombre,
        apellido: formValues.apellido,
        gmail: formValues.gmail,
        contrasenna: this.usuario.contrasenna,
        enabled: this.usuario.enabled,
        fechaCreacion: this.usuario.fechaCreacion
      };

      // Validación asíncrona de usuario repetido (solo si cambia el nombre de usuario)
      if (formValues.usuario !== this.usuario.usuario) {
        // Los validadores asíncronos ya se encargan de la validación
        // Si llegamos aquí y el formulario es válido, podemos continuar
        if (this.usuarioForm.get('usuario')?.hasError('usuarioExistente')) {
          this.notificationService.error('Error', {
            description: 'El nombre de usuario ya está en uso. Elige otro.'
          });
        } else {
          // Desactivar modo edición después de la validación exitosa
          this.modoEdicion = false;
          this.enviarActualizacion(usuarioActualizado);
        }
      } else {
        // Desactivar modo edición para casos en que no cambia el nombre de usuario
        this.modoEdicion = false;
        this.enviarActualizacion(usuarioActualizado);
      }
    } else {
      // Marcar todos los campos como touched para mostrar los errores de validación
      Object.keys(this.usuarioForm.controls).forEach(key => {
        const control = this.usuarioForm.get(key);
        control?.markAsTouched();
      });
      
      this.notificationService.warning('Validación', {
        description: 'Por favor, completa correctamente el formulario'
      });
    }
  }

  /**
   * Envía la actualización del usuario al backend
   */
  enviarActualizacion(usuarioActualizado: Usuario): void {
    const usernameCambiado = this.usuario && usuarioActualizado.usuario !== this.usuario.usuario;
    this.usuarioService.updateUsuario(usuarioActualizado).subscribe({
      next: () => {
        this.notificationService.success('Éxito', {
          description: 'Datos actualizados correctamente'
        });
        
        if (usernameCambiado) {
          this.notificationService.info('Información', {
            description: 'Se ha actualizado tu nombre de usuario. Serás redirigido al inicio.'
          });
          // Esperar un momento para que el usuario vea las notificaciones antes de redirigir a home
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          // Si no se cambió el nombre, solo recargamos los datos del usuario
          this.cargarDatosUsuario();
        }
      },
      error: (error) => {
        this.notificationService.error('Error', {
          description: 'No se pudieron actualizar los datos'
        });
      }
    });
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
    if (!this.usuario?.usuario) {
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
  
  /**
   * Verifica si se puede mostrar la opción de cambio de contraseña
   * @returns boolean - True si se puede mostrar la opción de cambio de contraseña
   */
  /**
   * Verifica si el usuario es una cuenta de Google y actualiza la variable esUsuarioGoogle
   * @returns boolean - True si NO es una cuenta de Google (puede modificar contraseña)
   */
  puedeModificarContrasenna(): boolean {
    // Verificar si es cuenta de Google y actualizar el estado
    this.detectarUsuarioGoogle();
    // Devolver false para cuentas Google (no pueden cambiar contraseña)
    return !this.esUsuarioGoogle;
  }
  
  /**
   * Detecta si la cuenta de usuario es de Google basándose en múltiples indicadores
   * Esta función actualiza la variable esUsuarioGoogle
   */
  detectarUsuarioGoogle(): void {
    if (!this.usuario) {
      this.esUsuarioGoogle = false;
      return;
    }

    // PASO 1: Verificar si el backend nos indica explícitamente que es usuario Google
    if (this.userData?.isGoogleUser !== undefined) {
      this.esUsuarioGoogle = this.userData.isGoogleUser;
      
      if (this.esUsuarioGoogle) {
        sessionStorage.setItem('auth_provider', 'google');
      }
      return;
    }
    
    // PASO 2: Verificar en sessionStorage
    const authProvider = sessionStorage.getItem('auth_provider');
    if (authProvider === 'google') {
      this.esUsuarioGoogle = true;
    }
  }

  /**
   * Devuelve la fecha de creación ajustada a la zona horaria local (España), mostrando solo día, mes y año
   */
  getFechaCreacionLocal(): string | null {
    if (!this.usuario?.fechaCreacion) return null;
    // Si la fecha viene como string sin zona horaria, la tratamos como UTC y la convertimos a local
    const fecha = new Date(this.usuario.fechaCreacion + 'Z');
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      timeZone: 'Europe/Madrid'
    });
  }

  /**
   * Activa el modo edición, haciendo los campos editables
   */
  activarEdicion(): void {
    // Verificar si es usuario de Google antes de activar edición
    this.detectarUsuarioGoogle();
    
    this.modoEdicion = true;
    
    // Configurar el formulario para validación en tiempo real
    this.usuarioForm.markAsUntouched();
    
    // Habilitar todos los campos del formulario primero
    this.usuarioForm.get('usuario')?.enable();
    this.usuarioForm.get('gmail')?.enable();
    
    // Para usuarios de Google, añadir validación visual para campos no editables
    if (this.esUsuarioGoogle) {
      // Marcar campo gmail como readonly programáticamente
      this.usuarioForm.get('gmail')?.disable();
    }
  }

  /**
   * Cancela la edición y restaura los valores originales
   */
  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.formularioEnviado = false;
    
    // Restaurar los valores originales si hay un usuario cargado
    if (this.usuario) {
      this.usuarioForm.patchValue({
        id: this.usuario.id,
        usuario: this.usuario.usuario,
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        gmail: this.usuario.gmail
      });
    }
  }

  // Servicio para comprobar si un nombre de usuario ya existe
  getUsuarioByUsername(username: string) {
    return this.usuarioService.getUsuarioByUsername(username);
  }
}
