import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OAuth2Service } from '../../../core/services/oauth2.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container min-vh-100 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="spinner-border text-primary mb-4" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <h2>Procesando tu inicio de sesión</h2>
        <p class="text-muted">Serás redirigido automáticamente...</p>
      </div>
    </div>
  `,
})
export class OauthSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oAuth2Service: OAuth2Service
  ) {}

  ngOnInit(): void {
    // Obtener el token de la URL
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (token) {
        // Procesar el token de autenticación
        this.oAuth2Service.handleOAuthSuccess(token);
        
        // Mostrar mensaje de éxito
        toast.success('¡Bienvenido!', { 
          description: 'Has iniciado sesión correctamente con Google',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        
        // Redirigir al usuario
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      } else {
        // Si no hay token, mostrar error y redirigir
        toast.error('Error', { 
          description: 'No se pudo completar el inicio de sesión',
          action: {
            label: 'Cerrar',
            onClick: () => toast.dismiss(),
          },
        });
        
        setTimeout(() => {
          this.router.navigate(['/api/v1/authenticate']);
        }, 1500);
      }
    });
  }
}
