import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  username: string = '';
  isAdmin: boolean = false;
  
  constructor(private authService: AutenticacionService) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }
  
  ngOnInit(): void {
    this.updateUserInfo();
    this.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) {
        this.updateUserInfo();
      } else {
        this.username = '';
        this.isAdmin = false;
      }
    });
  }
  
  private updateUserInfo(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.username = decodedToken.sub || ''; // sub contiene el nombre de usuario
        this.isAdmin = decodedToken.roles && 
                       Array.isArray(decodedToken.roles) && 
                       decodedToken.roles.includes('ROLE_ADMIN');
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
  }
  
  logout(): void {
    this.authService.logout();
    toast.success('Sesión cerrada', { 
      description: 'Has cerrado sesión correctamente',
      action: {
        label: 'Cerrar',
        onClick: () => toast.dismiss(),
      },
    });
  }
}
