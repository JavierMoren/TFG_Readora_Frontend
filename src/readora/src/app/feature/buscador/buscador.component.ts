import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LibrosService } from '../../core/services/libros.service';
import { AutorService } from '../../core/services/autor.service';
import { ResultadoBusquedaComponent, PageChangeEvent } from './resultado-busqueda/resultado-busqueda.component';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css'],
  
  imports: [CommonModule, ReactiveFormsModule, ResultadoBusquedaComponent]
})
export class BuscadorComponent implements OnInit {
  searchForm: FormGroup;
  isSearchingBooks: boolean = true;
  results: any[] = [];
  totalItems: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  loading: boolean = false;
  lastSearchTerm: string = '';
  lastSearchType: string = 'libros';

  constructor(
    private formBuilder: FormBuilder,
    private librosService: LibrosService,
    private autorService: AutorService
  ) { 
    this.searchForm = this.formBuilder.group({
      searchTerm: [''],
      searchType: ['libros'] // 'libros' o 'autores'
    });
  }

  ngOnInit(): void {
    this.searchForm.get('searchType')?.valueChanges.subscribe(value => {
      this.isSearchingBooks = value === 'libros';
      this.results = [];
      this.totalItems = 0;
      this.currentPage = 0;
    });
  }

  search(): void {
    if (!this.searchForm.valid) return;

    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const searchType = this.searchForm.get('searchType')?.value;
    
    this.lastSearchTerm = searchTerm;
    this.lastSearchType = searchType;
    
    if (searchTerm !== this.lastSearchTerm || searchType !== this.lastSearchType) {
      this.currentPage = 0;
    }
    
    this.loading = true;

    if (searchType === 'libros') {
      this.searchBooks(searchTerm);
    } else {
      this.searchAuthors(searchTerm);
    }
  }

  searchBooks(term: string): void {
    this.librosService.searchLibros(term, {}, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.results = data.content;
          this.totalItems = data.totalElements;
          this.loading = false;
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar libros', error);
          this.loading = false;
        }
      });
  }

  searchAuthors(term: string): void {
    this.autorService.searchAutores(term, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.results = data.content;
          this.totalItems = data.totalElements;
          this.loading = false;
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar autores', error);
          this.loading = false;
        }
      });
  }

  pageChanged(event: PageChangeEvent): void {
    // Obtenemos la página desde el evento
    const page = event.page;
    
    // Si hay un cambio en el tamaño de página, lo actualizamos
    if (event.pageSize !== undefined && event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
    }
    
    if (this.currentPage !== page || event.pageSize !== undefined) {
      this.currentPage = page;
      this.loading = true; // Mostrar indicador de carga
      
      // Obtener el tipo de búsqueda actual del formulario
      const searchType = this.searchForm.get('searchType')?.value || 'libros';
      
      // Ejecutar la búsqueda apropiada según el tipo
      if (searchType === 'libros') {
        this.librosService.searchLibros(this.lastSearchTerm, {}, page, this.pageSize)
          .subscribe({
            next: (data) => {
              // Actualizar resultados
              this.results = data.content;
              this.totalItems = data.totalElements;
              this.loading = false;
            },
            error: (error) => {
              console.error('[Buscador] Error al buscar libros', error);
              this.loading = false;
            }
          });
      } else {
        this.autorService.searchAutores(this.lastSearchTerm, page, this.pageSize)
          .subscribe({
            next: (data) => {
              // Actualizar resultados
              this.results = data.content;
              this.totalItems = data.totalElements;
              this.loading = false;
            },
            error: (error) => {
              console.error('[Buscador] Error al buscar autores', error);
              this.loading = false;
            }
          });
      }
    }
  }
}
