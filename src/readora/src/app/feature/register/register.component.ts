import { Component } from '@angular/core';
import { RegisterService } from '../../core/services/register.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

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
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    // Si el formulario es inválido, se muestra un error y no se procesa el envío.
    if (form.invalid) {
      toast.error('Error', { 
        description: 'Por favor, completa correctamente el formulario',
        action: {
          label: 'Cerrar',
          onClick: () => toast.dismiss(),
        },
      });
      return;
    }

    // Validar que ningún campo esté vacío o contenga solo espacios en blanco
    const isValid = Object.values(this.registerRequest).every(
      (value) => typeof value === 'string' && value.trim().length > 0 || value instanceof Date
    );

    if (!isValid) {
      toast.error('Error', { 
        description: 'Todos los campos son obligatorios y no pueden estar vacíos',
        action: {
          label: 'Cerrar',
          onClick: () => toast.dismiss(),
        },
      });
      return;
    }

    // Validar longitud de contraseña
    if (this.registerRequest.contrasenna.length < 6) {
      toast.error('Error', {
        description: 'La contraseña debe tener al menos 6 caracteres',
        action: {
          label: 'Cerrar',
          onClick: () => toast.dismiss(),
        },
      });
      return;
    }
    
    // Actualizar la fecha de creación al momento exacto del registro
    this.registerRequest.fechaCreacion = new Date();

    this.registerService.registerUsuario(this.registerRequest).subscribe({
      next: (response: HttpResponse<any>) => {
        // Verifica si el código de estado es 201 (Created)
        if (response.status === 201) {
          toast.success('¡Registrado!', { 
            description: 'Usuario registrado con éxito',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);
        } else {
          toast.error('Error', { 
            description: 'Respuesta inesperada del servidor',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        }
      },
      error: (error) => {
        console.error('[Register] Error al registrar usuario', error);
        // Maneja errores específicos
        if (error.status === 500) {
          toast.error('Error', { 
            description: 'Error interno del servidor',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        } else if (error.status === 400) {
          toast.error('Error', { 
            description: 'Datos de registro inválidos',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        } else if (error.status === 409) {
          toast.error('Error', { 
            description: 'El usuario o correo ya está registrado',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        } else {
          toast.error('Error', { 
            description: 'No se pudo registrar el usuario',
            action: {
              label: 'Cerrar',
              onClick: () => toast.dismiss(),
            },
          });
        }
      },
    });
  }
}