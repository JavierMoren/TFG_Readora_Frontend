import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { Libro } from '../../../models/libro/libro.model';

@Component({
  selector: 'app-detalle-libro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-libro.component.html',
  styleUrl: './detalle-libro.component.css'
})
export class DetalleLibroComponent implements OnInit {
  libro: Libro | null = null;
  loading: boolean = true;
  error: string | null = null;
  libroId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private librosService: LibrosService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.libroId = +params['id']; // Guardamos el ID para poder usarlo en la plantilla
      this.loadLibro(this.libroId);
    });
  }

  loadLibro(id: number): void {
    this.loading = true;
    this.error = null;

    this.librosService.getLibroById(id).subscribe({
      next: (data) => {
        this.libro = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el libro:', err);
        this.error = 'No se pudo cargar la información del libro.';
        this.loading = false;
      }
    });
  }
  
  // Método para recargar el libro actual
  reloadLibro(): void {
    this.loadLibro(this.libroId);
  }
  
  // Método para obtener la URL completa de la imagen de portada
  getPortadaUrl(path: string | null): string {
    return this.storageService.getFullImageUrl(path);
  }
  
  // Método para obtener la URL completa de la imagen de autor
  getAutorImageUrl(path: string | null): string {
    if (!path) return 'assets/images/default-author.jpg';
    return this.storageService.getFullImageUrl(path);
  }
}
