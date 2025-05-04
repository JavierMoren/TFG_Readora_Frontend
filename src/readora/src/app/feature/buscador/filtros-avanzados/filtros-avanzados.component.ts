import { Component, EventEmitter, Input, OnInit, OnChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filtros-avanzados',
  templateUrl: './filtros-avanzados.component.html',
  styleUrls: ['./filtros-avanzados.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class FiltrosAvanzadosComponent implements OnInit, OnChanges {
  @Input() isForBooks: boolean = true;
  @Output() filtersChanged = new EventEmitter<any>();

  filterForm: FormGroup;
  genres: string[] = [
    'Novela', 'Poesía', 'Ensayo', 'Ciencia Ficción', 'Fantasía',
    'Terror', 'Aventuras', 'Biografía', 'Historia', 'Infantil',
    'Juvenil', 'Ciencia', 'Filosofía', 'Arte', 'Otros'
  ];

  sortOptionsBooks = [
    { value: 'titulo', label: 'Título' },
    { value: 'autor', label: 'Autor' },
    { value: 'anioPublicacion', label: 'Año' },
    { value: 'valoracionPromedio', label: 'Valoración' }
  ];

  sortOptionsAuthors = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'fechaNacimiento', label: 'Fecha de nacimiento' },
    { value: 'cantidadLibros', label: 'Número de libros' }
  ];

  currentYear = new Date().getFullYear();
  yearRange: number[] = [];

  constructor(private formBuilder: FormBuilder) {
    // Inicializar rango de años (desde 1900 hasta el año actual)
    for (let year = 1900; year <= this.currentYear; year++) {
      this.yearRange.push(year);
    }

    // Inicializar formulario para libros por defecto
    this.filterForm = this.formBuilder.group({
      genre: [''],
      yearFrom: [''],
      yearTo: [''],
      sort: ['titulo'],
      direction: ['asc']
    });
  }

  ngOnInit(): void {}

  // Cuando cambia el tipo de búsqueda (libros/autores), actualizamos el formulario
  ngOnChanges(): void {
    if (!this.isForBooks) {
      this.filterForm = this.formBuilder.group({
        sort: ['nombre'],
        direction: ['asc']
      });
    } else {
      this.filterForm = this.formBuilder.group({
        genre: [''],
        yearFrom: [''],
        yearTo: [''],
        sort: ['titulo'],
        direction: ['asc']
      });
    }
  }

  // Aplicar filtros
  applyFilters(): void {
    const filterValues = this.filterForm.value;
    this.filtersChanged.emit(filterValues);
  }

  // Limpiar filtros
  clearFilters(): void {
    this.filterForm.reset();
    if (this.isForBooks) {
      this.filterForm.patchValue({
        sort: 'titulo',
        direction: 'asc'
      });
    } else {
      this.filterForm.patchValue({
        sort: 'nombre',
        direction: 'asc'
      });
    }
    this.filtersChanged.emit(this.filterForm.value);
  }
}