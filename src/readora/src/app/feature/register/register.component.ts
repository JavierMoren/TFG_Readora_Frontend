import { Component } from '@angular/core';
import { RegisterService } from '../../core/services/register.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { OAuth2Service } from '../../core/services/oauth2.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerRequest = {
    usuario: '',
    nombre: '',
    apellido: '',
    gmail: '',
    contrasenna: '',
    fechaCreacion: new Date()
  };
  
  constructor(
    private registerService: RegisterService, 
    private router: Router,
    private oauth2Service: OAuth2Service,
    private notificationService: NotificationService
  ) {}

  onSubmit(form: NgForm) {
    // Si el formulario es inválido, se muestra un error y no se procesa el envío.
    if (form.invalid) {
      this.notificationService.error('Error', { 
        description: 'Por favor, completa correctamente el formulario'
      });
      return;
    }

    // Validar que ningún campo esté vacío o contenga solo espacios en blanco
    const isValid = Object.values(this.registerRequest).every(
      (value) => typeof value === 'string' && value.trim().length > 0 || value instanceof Date
    );

    if (!isValid) {
      this.notificationService.error('Error', { 
        description: 'Todos los campos son obligatorios y no pueden estar vacíos'
      });
      return;
    }

    // Validar longitud de contraseña
    if (this.registerRequest.contrasenna.length < 6) {
      this.notificationService.error('Error', {
        description: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }
    
    // Actualizar la fecha de creación al momento exacto del registro
    this.registerRequest.fechaCreacion = new Date();

    this.registerService.registerUsuario(this.registerRequest).subscribe({
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
      },
    });
  }

  loginWithGoogle() {
    this.oauth2Service.loginWithGoogle();
  }
}