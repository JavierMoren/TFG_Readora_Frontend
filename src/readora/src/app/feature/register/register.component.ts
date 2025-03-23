import { Component } from '@angular/core';
import { RegisterService } from '../../core/services/register.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http'; // Importa HttpResponse

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

  constructor(private registerService: RegisterService, private router: Router) {}

  onSubmit(form: NgForm) {
    // Si el formulario es inválido, se muestra un error y no se procesa el envío.
    if (form.invalid) {
      Swal.fire('Error', 'Por favor, completa correctamente el formulario', 'error');
      return;
    }

    // Validar que ningún campo esté vacío o contenga solo espacios en blanco
    const isValid = Object.values(this.registerRequest).every(
      (value) => typeof value === 'string' && value.trim().length > 0
    );

    if (!isValid) {
      Swal.fire('Error', 'Todos los campos son obligatorios y no pueden estar vacíos', 'error');
      return;
    }

    this.registerService.registerUsuario(this.registerRequest).subscribe({
      next: (response: HttpResponse<any>) => {
        // Verifica si el código de estado es 201 (Created)
        if (response.status === 201) {
          console.log('Usuario registrado exitosamente', response.body);
          Swal.fire('¡Registrado!', 'Usuario registrado con éxito', 'success');
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);
        } else {
          console.error('Respuesta inesperada del servidor:', response);
          Swal.fire('Error', 'Respuesta inesperada del servidor', 'error');
        }
      },
      error: (error) => {
        console.error('Error al registrar usuario', error);

        // Maneja errores específicos
        if (error.status === 500) {
          Swal.fire('Error', 'Error interno del servidor', 'error');
        } else {
          Swal.fire('Error', 'No se pudo registrar el usuario', 'error');
        }
      },
    });
  }
}