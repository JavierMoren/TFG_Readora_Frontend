import { Component, OnInit } from '@angular/core';
import { LibrosService } from '../../core/services/libros.service';
import { CommonModule } from '@angular/common';
import { Libro } from '../../models/libro/libro.module';

@Component({
  selector: 'app-libros',
  imports: [CommonModule],
  templateUrl: './libros.component.html',
  styleUrl: './libros.component.css'
})
export class LibrosComponent implements OnInit {
  libros: Libro[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  sortField = 'id';
  sortDirection = 'asc';

  constructor(private librosService: LibrosService) {}

  ngOnInit(): void {
    this.loadLibros();
  }

  loadLibros(): void {
    this.librosService.getAllLibrosPaginados(
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortDirection
    ).subscribe({
      next: (response) => {
        this.libros = response.content.map((libro: any) => ({
          ...libro,
          ISBN: libro.isbn || 'No disponible' 
        }));
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        console.log('Libros cargados:', this.libros);
      },
      error: (error) => console.error('Error al cargar libros:', error)
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLibros();
    }
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadLibros();
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i);
  }
}
