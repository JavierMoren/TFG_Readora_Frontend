import { Component, OnInit } from '@angular/core';
import { RegisterService } from '../../core/services/register.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, first, catchError, switchMap } from 'rxjs/operators';
import { OAuth2Service } from '../../core/services/oauth2.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  usuarioVerificandose = false;
  gmailVerificandose = false;
  
  // Nuevos campos para mejorar la validación
  usuarioValido = false;
  gmailValido = false;
  formularioEnviado = false;
  
  constructor(
    private registerService: RegisterService,
    private usuarioService: UsuarioService, 
    private router: Router,
    private oauth2Service: OAuth2Service,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {}
  
  ngOnInit(): void {
    this.initForm();
  }
  
  initForm(): void {
    this.registerForm = this.fb.group({
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
      gmail: ['', {
        validators: [
          Validators.required,
          Validators.email
        ],
        asyncValidators: [this.emailUnicoValidator()],
        updateOn: 'blur'
      }],
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      contrasenna: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100)
      ]]
    });
  }
  
  // Validador asíncrono para comprobar si el usuario ya existe
  usuarioUnicoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        this.usuarioValido = false;
        return of(null);
      }

      this.usuarioVerificandose = true;
      this.usuarioValido = false;
      
      // Añadimos un pequeño retraso antes de hacer la petición para evitar demasiadas llamadas al API
      return of(control.value).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        // Hacemos la llamada al servicio
        switchMap((value: string) => {
          return this.usuarioService.checkUsuarioExiste(value);
        }),
        map(existe => {
          this.usuarioVerificandose = false;
          this.usuarioValido = !existe;
          return existe ? { usuarioExistente: true } : null;
        }),
        first(),
        catchError(error => {
          console.error(`[Register] Error al validar usuario "${control.value}"`, error);
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
      // Verificamos si el valor es válido antes de realizar la verificación
      if (!control.value || control.value.trim() === '') {
        this.gmailValido = false;
        return of(null);
      }
      
      // No usar Validators.email directamente como función
      const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
      if (!emailPattern.test(control.value)) {
        this.gmailValido = false;
        return of(null);
      }

      this.gmailVerificandose = true;
      this.gmailValido = false;
      
      // Usar switchMap para mejor control de flujo
      return of(control.value).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((email: string) => {
          return this.usuarioService.checkEmailExiste(email);
        }),
        map(existe => {
          this.gmailVerificandose = false;
          this.gmailValido = !existe;
          return existe ? { gmailExistente: true } : null;
        }),
        first(),
        catchError(error => {
          console.error(`[Register] Error al validar email "${control.value}"`, error);
          this.gmailVerificandose = false;
          this.gmailValido = false;
          return of(null);
        })
      );
    };
  }

  onSubmit() {
    this.formularioEnviado = true; // Marcar el formulario como enviado

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.notificationService.error('Error', { 
        description: 'Por favor, completa correctamente el formulario'
      });
      return;
    }

    if (this.registerForm.pending) {
      this.notificationService.error('Error', { 
        description: 'Por favor, espera mientras verificamos tus datos'
      });
      return;
    }
    
    // Crear el objeto de registro
    const registerRequest = {
      ...this.registerForm.value,
      fechaCreacion: new Date()
    };

    this.registerService.registerUsuario(registerRequest).subscribe({
      next: (response: HttpResponse<any>) => {
        // Verifica si el código de estado es 201 (Created)
        if (response.status === 201) {
          this.notificationService.success('¡Registrado!', { 
            description: 'Usuario registrado con éxito'
          });
          // Forzar comprobación de autenticación tras registro
          setTimeout(() => {
            this.oauth2Service.checkAuthAfterRegister();
            this.router.navigate(['/']);
          }, 1500);
        } else {
          this.notificationService.error('Error', { 
            description: 'Respuesta inesperada del servidor'
          });
        }
      },
      error: (error) => {
        console.error('[Register] Error al registrar usuario', error);
        // Maneja errores específicos
        if (error.status === 500) {
          this.notificationService.error('Error', { 
            description: 'Error interno del servidor'
          });
        } else if (error.status === 400) {
          this.notificationService.error('Error', { 
            description: 'Datos de registro inválidos'
          });
        } else if (error.status === 409) {
          this.notificationService.error('Error', { 
            description: 'El usuario o correo ya está registrado'
          });
        } else {
          this.notificationService.error('Error', { 
            description: 'No se pudo registrar el usuario'
          });
        }
      }
    });
  }

  loginWithGoogle() {
    this.oauth2Service.loginWithGoogle();
  }
  
  // Método para obtener mensajes de error específicos
  getErrorMessage(controlName: string): string | null {
    const control = this.registerForm.get(controlName);
    
    if (!control || !control.touched || !control.errors) {
      return null;
    }
    
    if (control.errors['required']) {
      return 'Este campo es requerido.';
    }
    
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres.`;
    }
    
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `No puede exceder ${maxLength} caracteres.`;
    }
    
    if (control.errors['email']) {
      return 'Ingresa un correo electrónico válido.';
    }
    
    if (control.errors['usuarioExistente']) {
      return 'Este nombre de usuario ya está en uso.';
    }
    
    if (control.errors['gmailExistente']) {
      return 'Este correo electrónico ya está registrado.';
    }
    
    return 'Campo inválido.';
  }
}
