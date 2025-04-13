import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../models/usuario/usuario.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario',
  imports: [CommonModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css'
})
export class UsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.getAllUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (error) => console.error('Error fetching usuarios', error)
    });
  }
}
