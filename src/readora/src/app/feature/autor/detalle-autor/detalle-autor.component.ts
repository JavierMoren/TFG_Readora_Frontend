import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AutorService } from '../../../core/services/autor.service';
import { LibrosService } from '../../../core/services/libros.service';
import { StorageService } from '../../../core/services/storage.service';
import { Autor } from '../../../models/autor/autor.model';
import { Libro } from '../../../models/libro/libro.model';

@Component({
  selector: 'app-detalle-autor',
  
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-autor.component.html',
  styleUrls: ['./detalle-autor.component.css']
})
export class DetalleAutorComponent implements OnInit {
  autorId!: number;
  autor: Autor | null = null;
  libros: Libro[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Rutas para imágenes predeterminadas
  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  constructor(
    private route: ActivatedRoute,
    private autorService: AutorService,
    private libroService: LibrosService,
    public storageService: StorageService
  ) { }

  ngOnInit(): void {
    // Obtener el ID del autor de la URL
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      this.autorId = +idParam;
      
      // Validar que el ID sea un número válido
      if (isNaN(this.autorId) || this.autorId <= 0) {
        console.error('[DetalleAutor] ID de autor inválido:', idParam);
        this.error = 'El ID del autor no es válido.';
        this.loading = false;
        return;
      }
      
      this.loadAutor();
    });
  }

  loadAutor(): void {
    this.loading = true;
    this.error = null;

    this.autorService.getAutorById(this.autorId).subscribe({
      next: (autor) => {
        this.autor = autor;
        this.cargarLibros();
      },
      error: (error: any) => {
        console.error('Error al cargar el autor', error);
        this.error = 'No se pudo cargar la información del autor. Por favor, inténtelo de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  cargarLibros(): void {
    if (this.autor && this.autor.id) {
      this.autorService.getLibrosByAutorId(this.autor.id).subscribe({
        next: (libros: Libro[]) => {
          this.libros = libros;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar libros del autor', error);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return this.autorPlaceholder;
    }
    return this.storageService.getFullImageUrl(imageUrl);
  }

  getBookImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return this.libroPlaceholder;
    }
    return this.storageService.getFullImageUrl(imageUrl);
  }

  reloadAutor(): void {
    this.loadAutor();
  }
}
