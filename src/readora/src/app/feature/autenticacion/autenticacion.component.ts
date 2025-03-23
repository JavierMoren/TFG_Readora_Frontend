import { Component } from '@angular/core';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-autenticacion',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './autenticacion.component.html',
  styleUrl: './autenticacion.component.css'
})
export class AutenticacionComponent {
  authRequest = {
    usuario: '',
    contrasenna: ''
  };

  constructor(private autenticacionService: AutenticacionService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      Swal.fire('Error', 'Por favor, completa correctamente el formulario', 'error');
      return;
    }

    const isValid = Object.values(this.authRequest).every(
      (value) => typeof value === 'string' && value.trim().length > 0
    );

    if (!isValid) {
      Swal.fire('Error', 'Todos los campos son obligatorios y no pueden estar vacíos', 'error');
      return;
    }

    this.autenticacionService.authenticateUsuario(this.authRequest.usuario, this.authRequest.contrasenna).subscribe({
      next: (response) => {
        console.log('Usuario autenticado exitosamente', response);
        Swal.fire('¡Autenticado!', 'Usuario autenticado con éxito', 'success');
        this.autenticacionService.setToken(response.token);
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error al autenticar usuario', error);

        if (error.status === 401) {
          Swal.fire('Error', 'Credenciales inválidas', 'error');
        } else {
          Swal.fire('Error', 'No se pudo autenticar el usuario', 'error');
        }
      }
    });
  }
}
