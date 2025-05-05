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
    // Suscripción a cambios en el tipo de búsqueda
    this.searchForm.get('searchType')?.valueChanges.subscribe(value => {
      this.isSearchingBooks = value === 'libros';
      this.results = [];
      this.totalItems = 0;
      this.currentPage = 0; // Resetear página al cambiar tipo de búsqueda
    });
  }

  search(): void {
    if (!this.searchForm.valid) return;

    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const searchType = this.searchForm.get('searchType')?.value;
    
    // Guardar términos de búsqueda actuales
    this.lastSearchTerm = searchTerm;
    this.lastSearchType = searchType;
    
    // Resetear a la primera página cuando se realiza una nueva búsqueda
    if (searchTerm !== this.lastSearchTerm || searchType !== this.lastSearchType) {
      this.currentPage = 0;
    }
    
    this.loading = true;

    console.log(`[Buscador] Realizando búsqueda de ${searchType} con término: "${searchTerm}", página: ${this.currentPage}`);

    if (searchType === 'libros') {
      this.searchBooks(searchTerm);
    } else {
      this.searchAuthors(searchTerm);
    }
  }

  searchBooks(term: string): void {
    console.log(`[Buscador] DEBUG: Enviando solicitud al backend - Búsqueda de libros, término: "${term}", página: ${this.currentPage}`);
    this.librosService.searchLibros(term, {}, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          console.log('[Buscador] DEBUG: Respuesta recibida del backend - Libros:', data);
          console.log(`[Buscador] Resultados obtenidos: ${data.content.length} libros (página ${this.currentPage + 1} de ${data.totalPages})`);
          this.results = data.content;
          this.totalItems = data.totalElements;
          this.loading = false;
          
          // Verificar que los resultados se actualizaron
          console.log('[Buscador] DEBUG: Results actualizados:', this.results);
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar libros', error);
          this.loading = false;
        }
      });
  }

  searchAuthors(term: string): void {
    console.log(`[Buscador] DEBUG: Enviando solicitud al backend - Búsqueda de autores, término: "${term}", página: ${this.currentPage}`);
    this.autorService.searchAutores(term, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          console.log('[Buscador] DEBUG: Respuesta recibida del backend - Autores:', data);
          console.log(`[Buscador] Resultados obtenidos: ${data.content.length} autores (página ${this.currentPage + 1} de ${data.totalPages})`);
          this.results = data.content;
          this.totalItems = data.totalElements;
          this.loading = false;
          
          // Verificar que los resultados se actualizaron
          console.log('[Buscador] DEBUG: Results actualizados:', this.results);
        },
        error: (error) => {
          console.error('[Buscador] Error al buscar autores', error);
          this.loading = false;
        }
      });
  }

  pageChanged(page: number): void {
    console.log(`[Buscador] Cambiando a página: ${page + 1} (anterior: ${this.currentPage + 1})`);
    console.log(`[Buscador] DEBUG: Contenido actual de results antes de cambiar:`, this.results);
    
    if (this.currentPage !== page) {
      this.currentPage = page;
      this.loading = true; // Mostrar indicador de carga
      
      // Obtener el tipo de búsqueda actual del formulario
      const searchType = this.searchForm.get('searchType')?.value || 'libros';
      
      console.log(`[Buscador] DEBUG: Tipo de búsqueda: ${searchType}, Término: "${this.lastSearchTerm}", Nueva página: ${page}`);
      
      // Ejecutar la búsqueda apropiada según el tipo
      if (searchType === 'libros') {
        console.log(`[Buscador] DEBUG: Llamando a searchLibros con página ${page}`);
        this.librosService.searchLibros(this.lastSearchTerm, {}, page, this.pageSize)
          .subscribe({
            next: (data) => {
              console.log(`[Buscador] DEBUG: Respuesta de la API para libros página ${page + 1}:`, data);
              console.log(`[Buscador] Nuevos resultados página ${page + 1}: ${data.content.length} libros de ${data.totalElements} (total páginas: ${data.totalPages})`);
              
              // Guardar antiguo estado para depuración
              const oldResults = [...this.results];
              
              // Actualizar resultados
              this.results = data.content;
              this.totalItems = data.totalElements;
              this.loading = false;
              
              console.log('[Buscador] DEBUG: Comparación de resultados:', {
                'Resultados anteriores': oldResults,
                'Nuevos resultados': this.results,
                'Cambiaron?': JSON.stringify(oldResults) !== JSON.stringify(this.results)
              });
            },
            error: (error) => {
              console.error(`[Buscador] Error al obtener página ${page + 1} de libros:`, error);
              this.loading = false;
            }
          });
      } else {
        console.log(`[Buscador] DEBUG: Llamando a searchAutores con página ${page}`);
        this.autorService.searchAutores(this.lastSearchTerm, page, this.pageSize)
          .subscribe({
            next: (data) => {
              console.log(`[Buscador] DEBUG: Respuesta de la API para autores página ${page + 1}:`, data);
              console.log(`[Buscador] Nuevos resultados página ${page + 1}: ${data.content.length} autores de ${data.totalElements} (total páginas: ${data.totalPages})`);
              
              // Guardar antiguo estado para depuración
              const oldResults = [...this.results];
              
              // Actualizar resultados
              this.results = data.content;
              this.totalItems = data.totalElements;
              this.loading = false;
              
              console.log('[Buscador] DEBUG: Comparación de resultados:', {
                'Resultados anteriores': oldResults,
                'Nuevos resultados': this.results,
                'Cambiaron?': JSON.stringify(oldResults) !== JSON.stringify(this.results)
              });
            },
            error: (error) => {
              console.error(`[Buscador] Error al obtener página ${page + 1} de autores:`, error);
              this.loading = false;
            }
          });
      }
    }
  }
}