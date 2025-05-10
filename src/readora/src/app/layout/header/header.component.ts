import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { Observable } from 'rxjs';
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
  
  constructor(private authService: AutenticacionService, public router: Router) {
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
    this.authService.getUserInfo().subscribe({
      next: (userInfo) => {
        if (userInfo) {
          this.username = userInfo.username || '';
          this.isAdmin = userInfo.roles && 
                         Array.isArray(userInfo.roles) && 
                         userInfo.roles.includes('ROLE_ADMIN');
        }
      },
      error: (error) => {
        console.error('Error al obtener información del usuario:', error);
        this.username = '';
        this.isAdmin = false;
      }
    });
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
