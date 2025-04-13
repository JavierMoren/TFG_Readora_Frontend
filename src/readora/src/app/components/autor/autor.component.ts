import { Component, OnInit } from '@angular/core';
import { AutorService } from '../../core/services/autor.service';
import { Autor } from '../../models/autor/autor.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-autor',
  imports: [CommonModule],
  templateUrl: './autor.component.html',
  styleUrl: './autor.component.css'
})
export class AutorComponent implements OnInit {
  autores: Autor[] = [];

  constructor(private autorService: AutorService) {}

  ngOnInit(): void {
    this.autorService.getAllAutores().subscribe({
      next: (data) => this.autores = data,
      error: (error) => console.error('Error fetching autores', error)
    });
  }
}
