import { Component, OnInit } from '@angular/core';
import { LibrosService } from '../../core/services/libros.service';
import { Libro } from '../../models/libro/libro.module';

@Component({
  selector: 'app-libros',
  imports: [],
  templateUrl: './libros.component.html',
  styleUrl: './libros.component.css'
})
export class LibrosComponent implements OnInit {
  libros: Libro[] = [];

  constructor(private librosService: LibrosService) {}

  ngOnInit(): void {
    this.librosService.getAllLibros().subscribe({
      next: (data) => this.libros = data,
      error: (error) => console.error('Error fetching libros', error)
    });
  }
}
