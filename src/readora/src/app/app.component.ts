import { Component } from '@angular/core';
import { Router, Event, NavigationEnd, RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ThemeService } from './core/services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  
  imports: [RouterOutlet, NgxSonnerToaster, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isDarkTheme = false;

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
      // Actualizar el atributo data-theme en el body para que CSS pueda reaccionar
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    });
    
    // Escuchar eventos de navegación para manejar el foco
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        // Mover el foco al contenido principal después de la navegación
        setTimeout(() => {
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
          }
        }, 100);
      }
    });
  }
}
