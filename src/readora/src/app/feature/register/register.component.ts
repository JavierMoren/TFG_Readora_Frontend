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
      (value) => typeof value === 'string' && value.trim().length > 0
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

    this.registerService.registerUsuario(this.registerRequest).subscribe({
      next: (response: HttpResponse<any>) => {
        // Verifica si el código de estado es 201 (Created)
        if (response.status === 201) {
          console.log('Usuario registrado exitosamente', response.body);
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
          console.error('Respuesta inesperada del servidor:', response);
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
        console.error('Error al registrar usuario', error);

        // Maneja errores específicos
        if (error.status === 500) {
          toast.error('Error', { 
            description: 'Error interno del servidor',
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