import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AutenticacionService } from '../../core/services/autenticacion.service';
import { NotificationService } from '../../core/services/notification.service';
import { Observable, Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy { 
  isLoggedIn$: Observable<boolean>;
  username: string = '';
  isAdmin: boolean = false;
  isGoogleUser: boolean = false;
  private readonly routerSubscription: Subscription;
  
  constructor(
    private readonly authService: AutenticacionService,
    public router: Router,
    private readonly notificationService: NotificationService
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateUserInfo();
    });
  }
  
  ngOnInit(): void {
    this.isLoggedIn$.subscribe((isUserLoggedIn: boolean) => {
      if (isUserLoggedIn) {
        this.updateUserInfo();
      } else {
        this.clearUserInfo();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  
  /**
   * Limpia la información del usuario cuando cierra sesión o el estado es false
   */
  private clearUserInfo(): void {
    this.username = '';
    this.isAdmin = false;
    this.isGoogleUser = false;
  }
  
  private updateUserInfo(): void {
    this.authService.getUserInfo().subscribe({
      next: (userInfo: any) => {
        if (!userInfo) return;
        
        // Actualizar nombre de usuario y roles
        this.updateBasicUserInfo(userInfo);
        
        // Detectar si es usuario de Google
        this.detectUserType(userInfo);
      },
      error: (error: any) => {
        console.error('Error al obtener información del usuario:', error);
        this.username = '';
        this.isAdmin = false;
        this.isGoogleUser = false;
      }
    });
  }
  
  /**
   * Actualiza la información básica del usuario
   */
  private updateBasicUserInfo(userInfo: any): void {
    this.username = userInfo.username ?? '';
    this.isAdmin = userInfo.roles && 
                  Array.isArray(userInfo.roles) && 
                  userInfo.roles.includes('ROLE_ADMIN');
  }
  
  /**
   * Detecta el tipo de usuario (Google o regular)
   */
  private detectUserType(userInfo: any): void {
    // CASO 1: El backend indica explícitamente que es un usuario de Google
    if (userInfo.isGoogleUser !== undefined) {
      this.handleExplicitGoogleFlag(userInfo.isGoogleUser);
      return;
    }
    
    // CASO 2: Verificar en sessionStorage
    if (sessionStorage.getItem('auth_provider') === 'google') {
      this.isGoogleUser = true;
      return;
    }
    
    // CASO 3: Verificar por patrón de contraseña
    if (this.isPasswordGooglePattern(userInfo)) return;
    
    // CASO 4: Verificar por email Gmail
    if (userInfo.email?.endsWith('@gmail.com')) {
      this.isGoogleUser = true;
    } else {
      this.isGoogleUser = false;
    }
  }
  
  /**
   * Maneja la bandera explícita de Google proporcionada por el backend
   */
  private handleExplicitGoogleFlag(isGoogleUser: boolean): void {
    this.isGoogleUser = isGoogleUser;
    
    if (this.isGoogleUser) {
      sessionStorage.setItem('auth_provider', 'google');
    }
  }
  
  /**
   * Verifica si la contraseña coincide con patrones típicos de autenticación de Google
   */
  private isPasswordGooglePattern(userInfo: any): boolean {
    if (userInfo.password && 
       (userInfo.password === 'GoogleAuth-NoPassword' || 
        userInfo.password.includes('Google'))) {
      this.isGoogleUser = true;
      sessionStorage.setItem('auth_provider', 'google');
      return true;
    }
    return false;
  }
  
  /**
   * Cierra la sesión del usuario actual (solo local, no Google)
   */
  logout(): void {
    this.notificationService.info('Cerrando sesión...', { 
      description: 'Por favor espera mientras cerramos tu sesión',
      duration: 1500
    });
    
    // Realizar el logout y manejar la respuesta
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.success('Sesión cerrada', { 
          description: 'Has cerrado sesión exitosamente',
          duration: 2000
        });
        setTimeout(() => {
          this.router.navigate(['/api/v1/authenticate']);
        }, 1000);
      },
      error: (error) => {
        console.error('[Header] Error durante logout', error);
        this.notificationService.warning('Sesión cerrada localmente', { 
          description: 'Se cerró la sesión local aunque hubo un error en el servidor',
          duration: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/api/v1/authenticate']);
        }, 1000);
      }
    });
  }
}
