import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  
  constructor(
    private readonly router: Router,
    private readonly notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    // Comprobar si hay un flag de inicio de sesión con Google
    const googleLoginSuccess = localStorage.getItem('google_login_success');
    if (googleLoginSuccess) {
      // Eliminar el flag para evitar mostrar la notificación en futuras cargas
      localStorage.removeItem('google_login_success');
      
      // Mostrar notificación de éxito
      setTimeout(() => {
        this.notificationService.success('¡Autenticado!', {
          description: 'Has iniciado sesión correctamente con Google'
        });
      }, 500);
    }
  }
}
