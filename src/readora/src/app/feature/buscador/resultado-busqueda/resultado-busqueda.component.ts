import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-resultado-busqueda',
  templateUrl: './resultado-busqueda.component.html',
  styleUrls: ['./resultado-busqueda.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ResultadoBusquedaComponent implements OnChanges {
  @Input() results: any[] = [];
  @Input() isBooks: boolean = true;
  @Input() totalItems: number = 0;
  @Input() currentPage: number = 0;
  @Input() pageSize: number = 10;
  @Output() pageChange = new EventEmitter<number>();

  totalPages: number = 0;
  pages: number[] = [];

  constructor(
    private router: Router,
    private storageService: StorageService
  ) {}

  ngOnChanges(): void {
    // Calcular el número total de páginas
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Crear array de páginas para la paginación
    this.pages = [];
    for (let i = 0; i < this.totalPages; i++) {
      if (
        i === 0 || // Primera página
        i === this.totalPages - 1 || // Última página
        (i >= this.currentPage - 2 && i <= this.currentPage + 2) // Páginas alrededor de la actual
      ) {
        this.pages.push(i);
      } else if (
        i === this.currentPage - 3 ||
        i === this.currentPage + 3
      ) {
        // Añadir separador
        this.pages.push(-1);
      }
    }
    
    // Eliminar duplicados
    this.pages = this.pages.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  changePage(page: number): void {
    if (page !== this.currentPage && page >= 0 && page < this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  navigateToDetails(item: any): void {
    if (this.isBooks) {
      this.router.navigate(['/libros', item.id]);
    } else {
      this.router.navigate(['/autores', item.id]);
    }
  }

  getImageUrl(item: any): string {
    if (this.isBooks) {
      return this.storageService.getFullImageUrl(item.portadaUrl);
    }
    return this.storageService.getFullImageUrl(null);
  }

  getAuthorImageUrl(item: any): string {
    if (!this.isBooks) {
      return this.storageService.getFullImageUrl(item.fotoUrl);
    }
    return this.storageService.getFullImageUrl('autor/default');
  }
}