import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-panel-administrador',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './panel-administrador.component.html',
  styleUrl: './panel-administrador.component.css'
})
export class PanelAdministradorComponent implements OnInit {
  activeTab: string = 'usuarios';

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    console.log('PanelAdministradorComponent inicializado');
    // Determinar la pestaña activa según la ruta actual
    const url = this.router.url;
    console.log('URL actual:', url);
    
    if (url.includes('libros')) {
      this.activeTab = 'libros';
    } else if (url.includes('autores')) {
      this.activeTab = 'autores';
    } else if (url.includes('roles')) {
      this.activeTab = 'roles';
    } else if (url.includes('usuario-libros')) {
      this.activeTab = 'usuario-libros';
    } else {
      this.activeTab = 'usuarios';
      // Redirigir a usuarios por defecto si estamos en la raíz del panel
      if (url === '/panel-administrador') {
        console.log('Redirigiendo a usuarios');
        this.router.navigate(['usuarios'], { relativeTo: this.route });
      }
    }
  }

  /**
   * Navega a la sección específica del panel de administrador
   * @param tab - Nombre de la pestaña a la que navegar
   */
  navigateTo(tab: string): void {
    console.log('Navegando a:', tab);
    this.activeTab = tab;
    this.router.navigate([tab], { relativeTo: this.route });
  }
}
