import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Autor } from '../../../models/autor/autor.model';
import { Libro } from '../../../models/libro/libro.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-detalle-autor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-autor.component.html',
  styleUrl: './detalle-autor.component.css'
})
export class DetalleAutorComponent implements OnInit {
  autor: Autor | null = null;
  libros: Libro[] = [];
  loading: boolean = true;
  error: string | null = null;
  autorId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {
    console.log('[DetalleAutor] Componente creado');
  }

  ngOnInit(): void {
    console.log('[DetalleAutor] Inicializando componente');
    this.route.params.subscribe(params => {
      this.autorId = +params['id'];
      console.log('[DetalleAutor] ID del autor obtenido de la ruta:', this.autorId);
      this.loadAutor(this.autorId);
    });
  }

  loadAutor(id: number): void {
    this.loading = true;
    this.error = null;
    console.log('[DetalleAutor] Cargando información del autor con ID:', id);

    // Realizamos dos llamadas paralelas: una para el autor y otra para sus libros
    forkJoin({
      autor: this.autorService.getAutorById(id),
      libros: this.autorService.getLibrosByAutorId(id)
    }).subscribe({
      next: (result) => {
        this.autor = result.autor;
        this.libros = result.libros;
        this.loading = false;
        console.log('[DetalleAutor] Autor cargado correctamente:', this.autor);
        console.log('[DetalleAutor] Libros del autor cargados:', this.libros.length, 'libros encontrados');
      },
      error: (err) => {
        console.error('[DetalleAutor] Error al cargar el detalle del autor:', err);
        this.error = 'No se pudo cargar la información completa del autor.';
        this.loading = false;
        this.notificationService.error('Error', {
          description: 'No se pudo cargar la información del autor'
        });
      }
    });
  }
  
  // Método para recargar el autor actual
  reloadAutor(): void {
    console.log('[DetalleAutor] Recargando información del autor');
    this.loadAutor(this.autorId);
    this.notificationService.info('Actualizando', {
      description: 'Recargando información del autor'
    });
  }
  
  // Método para obtener la URL completa de la imagen
  getImageUrl(path: string | null): string {
    const url = this.storageService.getFullImageUrl(path);
    console.log('[DetalleAutor] URL de imagen generada:', url);
    return url;
  }
}
