import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../models/usuario/usuario.model';
import { UsuarioService } from '../../core/services/usuario.service';

@Component({
  selector: 'app-panel-administrador',
  imports: [],
  templateUrl: './panel-administrador.component.html',
  styleUrl: './panel-administrador.component.css'
})
export class PanelAdministradorComponent implements OnInit {
  onAdd() {
  throw new Error('Method not implemented.');
  }
  onEdit(arg0: number) {
  throw new Error('Method not implemented.');
  }
  onDelete(arg0: number) {
  throw new Error('Method not implemented.');
  }
  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService) {}
  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.usuarioService.getAllUsuarios().subscribe({
      next: (response) => {
        this.usuarios = response;
        console.log('Usuarios cargados:', this.usuarios);
      },
      error: (error) => console.error('Error al cargar usuarios:', error)
    });
  }
}
