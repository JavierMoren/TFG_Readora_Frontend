import { Component } from '@angular/core';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { OAuth2Service } from '../../core/services/oauth2.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  };  constructor(
    private autenticacionService: AutenticacionService, 
    private router: Router,
    private oauth2Service: OAuth2Service,
    private notificationService: NotificationService
  ) {}
  loginWithGoogle() {
    this.oauth2Service.loginWithGoogle();
  }
  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.notificationService.error('Error', { 
        description: 'Por favor, completa correctamente el formulario'
      }); 
      return;
    }

    const isValid = Object.values(this.authRequest).every(
      (value) => typeof value === 'string' && value.trim().length > 0
    );

    if (!isValid) {
      this.notificationService.error('Error', { 
        description: 'Todos los campos son obligatorios y no pueden estar vacíos'
      }); 
      return;
    }

    this.autenticacionService.authenticateUsuario(this.authRequest.usuario, this.authRequest.contrasenna).subscribe({
      next: (response) => {
        this.notificationService.success('¡Autenticado!', { 
          description: 'Usuario autenticado con éxito'
        }); 
        this.autenticacionService.setToken(response.token);
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      },
      error: (error) => {
        console.error('Error al autenticar usuario', error);

        if (error.status === 401) {
          this.notificationService.error('Error', { 
            description: 'Credenciales inválidas'
          }); 
        } else {
          this.notificationService.error('Error', { 
            description: 'No se pudo autenticar el usuario'
          }); 
        }
      }
    });
  }
}