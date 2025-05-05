import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { Libro } from '../../../models/libro/libro.model';
import { Autor } from '../../../models/autor/autor.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-detalle-libro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-libro.component.html',
  styleUrl: './detalle-libro.component.css'
})
export class DetalleLibroComponent implements OnInit {
  libro: Libro | null = null;
  autores: Autor[] = [];
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
      console.log('Inicializando componente de detalle para el libro con ID:', this.libroId);
      this.loadLibro(this.libroId);
    });
  }

  loadLibro(id: number): void {
    this.loading = true;
    this.error = null;
    console.log('Cargando información del libro con ID:', id);

    // Realizamos dos llamadas paralelas: una para el libro y otra para sus autores
    forkJoin({
      libro: this.librosService.getLibroById(id),
      autores: this.librosService.getAutoresByLibroId(id)
    }).subscribe({
      next: (result) => {
        this.libro = result.libro;
        this.autores = result.autores;
        this.loading = false;
        console.log('Libro cargado correctamente:', this.libro);
        console.log('Autores del libro cargados:', this.autores);
      },
      error: (err) => {
        console.error('Error al cargar el detalle del libro:', err);
        this.error = 'No se pudo cargar la información completa del libro.';
        this.loading = false;
      }
    });
  }
  
  // Método para recargar el libro actual
  reloadLibro(): void {
    this.loadLibro(this.libroId);
  }
  
  // Método para obtener la URL completa de la imagen de portada
  getPortadaUrl(path: string | null | undefined): string {
    return this.storageService.getFullImageUrl(path || null);
  }
  
  // Método para obtener la URL completa de la imagen de autor
  getAutorImageUrl(path: string | null | undefined): string {
    if (!path) return 'assets/images/default-author.jpg';
    return this.storageService.getFullImageUrl(path);
  }
}
