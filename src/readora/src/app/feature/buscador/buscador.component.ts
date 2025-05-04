import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LibrosService } from '../../core/services/libros.service';
import { AutorService } from '../../core/services/autor.service';
import { ResultadoBusquedaComponent } from './resultado-busqueda/resultado-busqueda.component';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css'],
  standalone: true,
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
    // Suscripción a cambios en el tipo de búsqueda
    this.searchForm.get('searchType')?.valueChanges.subscribe(value => {
      this.isSearchingBooks = value === 'libros';
      this.results = [];
      this.totalItems = 0;
    });
  }

  search(): void {
    if (!this.searchForm.valid) return;

    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const searchType = this.searchForm.get('searchType')?.value;
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
          console.error('Error al buscar libros', error);
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
          console.error('Error al buscar autores', error);
          this.loading = false;
        }
      });
  }

  pageChanged(page: number): void {
    this.currentPage = page;
    this.search();
  }
}