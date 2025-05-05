import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { Libro } from '../../../models/libro/libro.model';

@Component({
  selector: 'app-detalle-libro',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
      console.log('Inicializando componente de detalle para el libro con ID:', this.libroId);
      this.loadLibro(this.libroId);
    });
  }

  loadLibro(id: number): void {
    this.loading = true;
    this.error = null;
    console.log('Cargando información del libro con ID:', id);

    // Manejo de errores: intenta primero con el endpoint de detalle, si falla usa el método básico
    this.librosService.getLibroDetalleById(id).subscribe({
      next: (data) => {
        console.log('Libro cargado con éxito (con detalle):', data);
        this.libro = data;
        this.loading = false;
        
        if (data.autores) {
          console.log('Autores encontrados:', data.autores.length);
        } else {
          console.log('No se encontraron autores');
        }
      },
      error: (err) => {
        console.error('Error al cargar el detalle del libro:', err);
        console.log('Intentando cargar información básica del libro...');
        
        // Si falla el endpoint de detalle, probamos con el endpoint básico
        this.librosService.getLibroById(id).subscribe({
          next: (basicData) => {
            console.log('Libro cargado con éxito (información básica):', basicData);
            this.libro = basicData;
            this.loading = false;
          },
          error: (basicErr) => {
            console.error('Error al cargar información básica del libro:', basicErr);
            this.error = 'No se pudo cargar la información del libro.';
            this.loading = false;
          }
        });
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
