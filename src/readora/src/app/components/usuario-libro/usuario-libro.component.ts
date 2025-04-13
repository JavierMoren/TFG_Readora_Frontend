import { Component, OnInit } from '@angular/core';
import { UsuarioLibroService } from '../../core/services/usuario-libro.service';
import { UsuarioLibro } from '../../models/usuario-libro/usuario-libro.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-libro',
  imports: [CommonModule],
  templateUrl: './usuario-libro.component.html',
  styleUrl: './usuario-libro.component.css'
})
export class UsuarioLibroComponent implements OnInit {
  usuarioLibros: UsuarioLibro[] = [];

  constructor(private usuarioLibroService: UsuarioLibroService) {}

  ngOnInit(): void {
    this.usuarioLibroService.getAllUsuarioLibros().subscribe({
      next: (data) => this.usuarioLibros = data,
      error: (error) => console.error('Error fetching usuario-libros', error)
    });
  }
}
