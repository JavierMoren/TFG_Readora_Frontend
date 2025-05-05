import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { Autor } from '../../../models/autor/autor.model';

@Component({
  selector: 'app-detalle-autor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-autor.component.html',
  styleUrl: './detalle-autor.component.css'
})
export class DetalleAutorComponent implements OnInit {
  autor: Autor | null = null;
  loading: boolean = true;
  error: string | null = null;
  autorId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private autorService: AutorService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.autorId = +params['id'];
      this.loadAutor(this.autorId);
    });
  }

  loadAutor(id: number): void {
    this.loading = true;
    this.error = null;

    // Usamos el nuevo método que obtiene el detalle completo con libros
    this.autorService.getAutorDetalleById(id).subscribe({
      next: (data) => {
        this.autor = data;
        this.loading = false;
        console.log('Detalle de autor cargado correctamente:', data);
      },
      error: (err) => {
        console.error('Error al cargar el detalle del autor:', err);
        this.error = 'No se pudo cargar la información completa del autor.';
        this.loading = false;
      }
    });
  }
  
  // Método para recargar el autor actual
  reloadAutor(): void {
    this.loadAutor(this.autorId);
  }
  
  // Método para obtener la URL completa de la imagen
  getImageUrl(path: string | null): string {
    return this.storageService.getFullImageUrl(path);
  }
}
