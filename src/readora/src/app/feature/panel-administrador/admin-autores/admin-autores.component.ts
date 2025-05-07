import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Autor } from '../../../models/autor/autor.model';

@Component({
  selector: 'app-admin-autores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-autores.component.html',
  styleUrl: './admin-autores.component.css'
})
export class AdminAutoresComponent implements OnInit {
  autores: Autor[] = [];
  displayedAutores: Autor[] = [];
  currentAutor: any = {
    nombre: '',
    apellido: '',
    fechaNacimiento: null,
    fechaFallecimiento: null,
    biografia: '',
    fotoUrl: null
  };
  selectedFile: File | null = null;
  previewImageUrl: string | null = null;
  showForm: boolean = false;
  isEditing: boolean = false;
  isUploading: boolean = false;
  
  // Paginación
  pageSize: number = 12;
  currentPage: number = 1;
  totalPages: number = 0;
  
  // Rutas para imágenes predeterminadas
  readonly autorPlaceholder = 'assets/placeholders/author-placeholder.svg';

  constructor(
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadAutores();
  }

  loadAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (autores) => {
        this.autores = autores;
        this.calculateTotalPages();
        this.updateDisplayedAutores();
      },
      error: (error) => {
        console.error('Error al cargar autores', error);
        this.notificationService.error('Error', { description: 'No se pudo cargar la lista de autores' });
      }
    });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.autores.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  updateDisplayedAutores(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedAutores = this.autores.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedAutores();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedAutores();
    }
  }

  prepareCreateAutor(): void {
    this.isEditing = false;
    this.currentAutor = {
      nombre: '',
      apellido: '',
      fechaNacimiento: null,
      fechaFallecimiento: null,
      biografia: '',
      fotoUrl: null
    };
    this.selectedFile = null;
    this.previewImageUrl = null;
    this.showForm = true;
  }

  prepareUpdateAutor(autor: Autor): void {
    this.isEditing = true;
    this.currentAutor = { ...autor };
    this.selectedFile = null;
    
    if (autor.fotoUrl) {
      this.previewImageUrl = this.getImageUrl(autor.fotoUrl);
    } else {
      this.previewImageUrl = null;
    }
    
    this.showForm = true;
  }

  cancelEdit(): void {
    this.showForm = false;
    this.currentAutor = {};
    this.previewImageUrl = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Crear una URL para vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveAutor(): void {
    if (!this.currentAutor.nombre || !this.currentAutor.apellido) {
      this.notificationService.warning('Error', { description: 'El nombre y apellido son obligatorios' });
      return;
    }
    
    this.isUploading = true;
    
    // Función para guardar o actualizar el autor
    const saveAutorFn = () => {
      if (this.isEditing) {
        this.autorService.updateAutor(this.currentAutor).subscribe({
          next: () => {
            this.notificationService.success('Éxito', { description: 'Autor actualizado correctamente' });
            this.showForm = false;
            this.isUploading = false;
            this.loadAutores();
          },
          error: (error) => {
            console.error('Error al actualizar autor', error);
            this.notificationService.error('Error', { description: 'No se pudo actualizar el autor' });
            this.isUploading = false;
          }
        });
      } else {
        this.autorService.createAutor(this.currentAutor).subscribe({
          next: () => {
            this.notificationService.success('Éxito', { description: 'Autor creado correctamente' });
            this.showForm = false;
            this.isUploading = false;
            this.loadAutores();
          },
          error: (error) => {
            console.error('Error al crear autor', error);
            this.notificationService.error('Error', { description: 'No se pudo crear el autor' });
            this.isUploading = false;
          }
        });
      }
    };
    
    // Si hay un archivo seleccionado, subirlo primero
    if (this.selectedFile) {
      this.storageService.uploadAutorFoto(this.selectedFile).subscribe({
        next: (response: any) => {
          this.currentAutor.fotoUrl = response.filename;
          saveAutorFn();
        },
        error: (error: any) => {
          console.error('Error al subir la foto', error);
          this.notificationService.error('Error', { description: 'No se pudo subir la foto del autor' });
          this.isUploading = false;
        }
      });
    } else {
      saveAutorFn();
    }
  }

  deleteAutor(id: number): void {
    this.notificationService.confirm({
      title: 'Eliminar autor',
      text: '¿Estás seguro de que deseas eliminar este autor? Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result) {
        this.autorService.deleteAutor(id).subscribe({
          next: () => {
            this.notificationService.success('Éxito', { description: 'Autor eliminado correctamente' });
            this.loadAutores();
          },
          error: (error) => {
            console.error('Error al eliminar autor', error);
            this.notificationService.error('Error', { description: 'No se pudo eliminar el autor' });
          }
        });
      }
    });
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) {
      return this.autorPlaceholder;
    }
    return this.storageService.getFullImageUrl(url);
  }
}