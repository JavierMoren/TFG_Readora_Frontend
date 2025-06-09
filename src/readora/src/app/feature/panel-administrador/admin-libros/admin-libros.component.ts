import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Libro } from '../../../models/libro/libro.model';
import { Autor } from '../../../models/autor/autor.model';
import { LibrosService } from '../../../core/services/libros.service';
import { AutorService } from '../../../core/services/autor.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-libros',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-libros.component.html',
  styleUrl: './admin-libros.component.css'
})
export class AdminLibrosComponent implements OnInit {
  libros: Libro[] = [];
  currentLibro: any = this.initializeLibro();
  libroDetalle: Libro | null = null;
  showForm: boolean = false;
  isEditing: boolean = false;
  searchTerm: string = '';
  searchId: number | null = null;
  tipoBusqueda: 'texto' | 'id' = 'texto';
  
  selectedFile: File | null = null;
  previewPortadaUrl: string | null = null;
  isUploading: boolean = false;
  
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  sortBy: string = 'id';
  sortDirection: string = 'asc';
  
  libroIdToDelete: number | null = null;
  
  // Propiedades para validación de ISBN
  isbnDuplicado: boolean = false;
  mensajeErrorIsbn: string = '';

  allAutores: Autor[] = [];
  selectedAutorId: number | null = null;
  showAutorSelectorModal: boolean = false;

  readonly libroPlaceholder = 'assets/placeholders/book-placeholder.svg';

  Math = Math;

  constructor(
    private librosService: LibrosService,
    private autorService: AutorService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getLibrosPaginados();
    this.loadAutores();
    
    // Inicializar currentLibro y verificar autores
    if (!this.currentLibro) {
      this.currentLibro = this.initializeLibro();
    }
    this.verificarAutores();
  }

  /**
   * Carga los autores disponibles para la asociación con libros
   */
  loadAutores(): void {
    this.autorService.getAllAutores().subscribe({
      next: (data) => this.allAutores = data,
      error: (error) => {
        // console.error('[AdminLibros] Error al cargar autores', error);
        this.notificationService.error('Error', { description: 'No se pudieron cargar los autores' });
      }
    });
  }
  
  /**
   * Alias para mantener compatibilidad con código existente
   */
  getAllAutores = (): void => this.loadAutores();
  
  /**
   * Recupera los libros aplicando filtros y paginación para optimizar la carga
   */
  getLibrosPaginados(): void {
    this.librosService.getLibrosPaginados(
      this.currentPage, 
      this.pageSize, 
      this.sortBy, 
      this.sortDirection,
      this.searchTerm
    ).subscribe({
      next: (data) => {
        this.libros = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        
        // Para cada libro, cargar sus autores asociados
        this.libros.forEach(libro => {
          if (libro.id) {
            this.librosService.getAutoresByLibroId(libro.id).subscribe({
              next: (autores) => {
                libro.autores = autores;
              },
              error: (error) => {
                // console.error(`[AdminLibros] Error al cargar autores del libro ${libro.id}`, error);
              }
            });
          }
        });
      },
      error: (error: any) => {
        // console.error('[AdminLibros] Error al cargar libros', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron cargar los libros'
        });
      }
    });
  }

  /**
   * Buscar libros según el término ingresado
   */
  buscarLibros(): void {
    if (!this.searchTerm.trim()) {
      this.notificationService.warning('Atención', { 
        description: 'Ingrese un término de búsqueda'
      });
      return;
    }
    this.currentPage = 0; // Volver a la primera página al buscar
    
    // Usar searchLibros en lugar de getLibrosPaginados para búsquedas por texto
    this.librosService.searchLibros(
      this.searchTerm,
      {}, // Sin filtros adicionales
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (data) => {
        this.libros = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        
        // Para cada libro, cargar sus autores asociados
        this.libros.forEach(libro => {
          if (libro.id) {
            this.librosService.getAutoresByLibroId(libro.id).subscribe({
              next: (autores) => {
                libro.autores = autores;
              },
              error: (error) => {
                // console.error(`[AdminLibros] Error al cargar autores del libro ${libro.id}`, error);
              }
            });
          }
        });
        
        // Notificar resultado de la búsqueda
        if (this.libros.length > 0) {
          this.notificationService.success('Búsqueda completada', {
            description: `Se encontraron ${this.totalElements} libros que coinciden con "${this.searchTerm}"`
          });
        } else {
          this.notificationService.info('Sin resultados', {
            description: `No se encontraron libros que coincidan con "${this.searchTerm}"`
          });
        }
      },
      error: (error) => {
        // console.error('[AdminLibros] Error al buscar libros por texto', error);
        this.notificationService.error('Error', { 
          description: 'No se pudieron buscar los libros'
        });
        this.libros = [];
        this.totalElements = 0;
        this.totalPages = 0;
      }
    });
  }

  /**
   * Busca un libro específico por su ID
   */
  buscarLibroPorId(): void {
    if (!this.searchId || this.searchId <= 0) {
      this.notificationService.warning('Atención', { 
        description: 'Ingrese un ID de libro válido'
      });
      return;
    }
    
    this.librosService.getLibroById(this.searchId).subscribe({
      next: (libro) => {
        this.libros = [libro];
        this.totalElements = 1;
        this.totalPages = 1;
        
        // Cargar los autores para este libro
        if (libro.id) {
          this.librosService.getAutoresByLibroId(libro.id).subscribe({
            next: (autores) => {
              libro.autores = autores;
            },
            error: (error) => {
              // console.error(`[AdminLibros] Error al cargar autores del libro ${libro.id}`, error);
            }
          });
        }
        
        this.notificationService.success('Búsqueda completada', {
          description: `Se encontró el libro con ID ${this.searchId}`
        });
      },
      error: (error) => {
        console.error('[AdminLibros] Error al buscar libro por ID', error);
        this.notificationService.error('Error', { 
          description: `No se encontró el libro con ID ${this.searchId}`
        });
        this.libros = [];
        this.totalElements = 0;
        this.totalPages = 0;
      }
    });
  }

  /**
   * Limpia la búsqueda y recarga los libros
   * @param tipo - Tipo de búsqueda a limpiar ('id' o 'texto')
   */
  limpiarBusqueda(tipo: 'id' | 'texto' = 'texto'): void {
    if (tipo === 'id') {
      this.searchId = null;
    } else {
      this.searchTerm = '';
    }
    this.currentPage = 0;
    this.getLibrosPaginados();
  }
  
  // Alias para mantener compatibilidad con código existente
  limpiarBusquedaId = (): void => this.limpiarBusqueda('id');

  /**
   * Prepara el formulario para crear un nuevo libro
   */
  prepareCreateLibro(): void {
    this.isEditing = false;
    this.currentLibro = this.initializeLibro();
    this.limpiarErrorIsbn();
    this.selectedFile = null;
    this.previewPortadaUrl = this.libroPlaceholder;
    this.showForm = true;
  }

  /**
   * Prepara el formulario para editar un libro existente
   * @param libro - Libro a editar
   */
  prepareUpdateLibro(libro: Libro): void {
    this.isEditing = true;
    this.selectedFile = null;
    
    // Primero, cargamos los autores asociados al libro
    this.librosService.getAutoresByLibroId(libro.id).subscribe({
      next: (autores) => {
        this.currentLibro = {
          ...libro,
          autores: autores || []
        };
        
        // Mostrar la portada actual si existe
        if (libro.portadaUrl) {
          this.previewPortadaUrl = this.librosService.getImageUrl(libro.portadaUrl);
        } else {
          this.previewPortadaUrl = this.libroPlaceholder;
        }
        
        this.showForm = true;
      },
      error: (error) => {
        console.error(`[AdminLibros] Error al cargar autores del libro ${libro.id}`, error);
        // A pesar del error, permitimos editar el libro, pero sin los autores
        this.currentLibro = {
          ...libro,
          autores: []
        };
        
        // Mostrar la portada actual si existe
        if (libro.portadaUrl) {
          this.previewPortadaUrl = this.librosService.getImageUrl(libro.portadaUrl);
        } else {
          this.previewPortadaUrl = this.libroPlaceholder;
        }
        
        this.showForm = true;
        
        this.notificationService.warning('Advertencia', {
          description: 'No se pudieron cargar los autores asociados al libro'
        });
      }
    });
  }

  /**
   * Determina si debe crear o actualizar un libro
   */
  saveLibro(): void {
    // Validaciones básicas antes de proceder
    if (!this.formularioValido()) {
      this.notificationService.warning('Datos incorrectos', { 
        description: 'Por favor, corrija los datos del formulario antes de guardar'
      });
      return;
    }
    
    // Segunda validación específica de ISBN si es necesario
    if (this.currentLibro.isbn && !this.isValidISBN(this.currentLibro.isbn)) {
      this.notificationService.warning('ISBN inválido', { 
        description: 'El formato del ISBN no es válido. Debe ser ISBN-10 o ISBN-13'
      });
      return;
    }
    
    // Si todas las validaciones pasan, procedemos con la subida de imagen y guardado
    this.uploadImageAndSaveLibro();
  }

  /**
   * Sube la imagen de la portada y guarda el libro
   * @returns Promise que se resuelve cuando el libro se guarda correctamente
   */
  uploadImageAndSaveLibro(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.isUploading = true;
      const libroParaGuardar = this.prepararLibroParaEnviar(this.currentLibro);
      
      // Manejar el caso con nueva imagen
      if (this.selectedFile) {
        this.storageService.uploadImage(this.selectedFile, 'libro').subscribe({
          next: (response: any) => {
            // Extraer URL del objeto o usar directamente si es string
            libroParaGuardar.portadaUrl = typeof response === 'object' && response.url ? response.url : response;
            this.guardarLibro(libroParaGuardar, resolve, reject);
          },
          error: (error) => {
            console.error('[AdminLibros] Error al subir imagen:', error);
            this.isUploading = false;
            
            // Verificar si es un error 413 (Payload Too Large)
            if (error.status === 413) {
              this.notificationService.error('Archivo demasiado grande', {
                description: 'La imagen seleccionada supera el tamaño máximo permitido. Por favor, selecciona una imagen más pequeña.'
              });
            } else {
              this.notificationService.error('Error al subir imagen', {
                description: 'No se pudo subir la portada del libro'
              });
            }
            
            reject(error);
          }
        });
      } else {
        // Sin nueva imagen, guardar directamente
        this.guardarLibro(libroParaGuardar, resolve, reject);
      }
    });
  }
  
  /**
   * Función auxiliar para guardar el libro según sea creación o actualización
   */
  private guardarLibro(libro: any, resolve: Function, reject: Function): void {
    if (this.isEditing) {
      this.updateLibro(libro, resolve, reject);
    } else {
      this.createLibro(libro, resolve, reject);
    }
  }

  /**
   * Elimina un libro
   * @param id - ID del libro a eliminar
   */
  async deleteLibro(id: number): Promise<void> {
    const libroInfo = this.libros.find(libro => libro.id === id);
    const nombreLibro = libroInfo?.titulo || 'el libro';
    this.libroIdToDelete = id;
    
    const confirmed = await this.notificationService.confirm({
      title: '¿Eliminar libro?',
      text: `Esta acción eliminará ${nombreLibro} y no se podrá deshacer. Si el libro tiene registros de lectura asociados, primero deberá eliminarlos desde el panel de gestión de lecturas.`,
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    confirmed ? this.procesarEliminacionLibro() : this.libroIdToDelete = null;
  }
  
  /**
   * Procesa la eliminación del libro
   */
  private procesarEliminacionLibro(): void {
    if (this.libroIdToDelete === null) return;
    
    this.librosService.deleteLibro(this.libroIdToDelete).subscribe({
      next: () => {
        this.notificationService.success('Eliminado', { description: 'El libro ha sido eliminado correctamente' });
        this.getLibrosPaginados();
        this.libroIdToDelete = null;
      },
      error: (error) => {
        console.error('[AdminLibros] Error al eliminar libro', error);
        
        // Verificar si es un error de restricción relacional
        const palabrasErrorRelacional = ['constraint', 'relacionado', 'registros de lectura', 'foreign key', 'references'];
        const esErrorRelacional = palabrasErrorRelacional.some(term => 
          error?.error?.message?.includes(term) || error?.error?.includes(term)
        );
        
        if (esErrorRelacional) {
          // Para errores de integridad referencial, mostrar como información
          this.notificationService.info('No se puede eliminar', {
            description: 'Este libro no puede ser eliminado porque tiene registros de lectura asociados. Primero debe eliminar estas relaciones desde el panel "Gestión de Lecturas".'
          });
        } else {
          // Para otros errores, mostrar como advertencia
          this.notificationService.warning('Advertencia', {
            description: 'No se pudo eliminar el libro. Verifique si existen registros dependientes.'
          });
        }
        
        this.libroIdToDelete = null;
      }
    });
  }

  cancelDeleteLibro(): void {
    this.libroIdToDelete = null;
  }

  /**
   * Busca libros con el término ingresado
   */
  searchLibros(): void {
    this.currentPage = 0;
    this.getLibrosPaginados();
  }

  /**
   * Cambia a una página específica
   * @param page - Número de página (base 0)
   */
  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getLibrosPaginados();
    }
  }

  /**
   * Cambia el ordenamiento de los datos de la tabla
   * @param sortBy - Campo por el que ordenar
   */
  changeSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      // Si ya está ordenando por este campo, cambia la dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0; // Vuelve a la primera página
    this.getLibrosPaginados();
  }

  /**
   * Selecciona un autor para agregarlo al libro
   */
  selectAutor(): void {

    
    if (this.selectedAutorId) {
      // Buscar el autor completo basado en su ID
      const autorSeleccionado = this.allAutores.find(a => a.id === this.selectedAutorId);

      
      if (autorSeleccionado) {
        // Asegurar que el array de autores esté inicializado
        this.verificarAutores();
        
        // Verificar que no esté ya en la lista
        const yaExiste = this.currentLibro.autores.some((a: any) => a.id === autorSeleccionado.id);

        
        if (!yaExiste) {
          try {
            // Crear una copia del autor para evitar problemas de referencia
            const autorCopia = JSON.parse(JSON.stringify(autorSeleccionado));
            
            // Crear un nuevo array para forzar la detección de cambios
            this.currentLibro.autores = [...this.currentLibro.autores, autorCopia];

            
            // Notificar al usuario
            this.notificationService.info('Autor agregado', { 
              description: `${autorCopia.nombre} ${autorCopia.apellido} añadido al libro`
            });
          } catch (error) {
            console.error('Error al añadir autor:', error);
            this.notificationService.error('Error', { 
              description: 'No se pudo añadir el autor al libro'
            });
          }
        } else {
          this.notificationService.warning('Autor ya incluido', { 
            description: 'Este autor ya está añadido al libro'
          });
        }
      }
    }
    
    // Limpiar selección y cerrar modal
    this.selectedAutorId = null;
    this.showAutorSelectorModal = false;
  }

  /**
   * Elimina un autor de la lista de autores del libro
   * @param autor - Autor a eliminar
   */
  removeAutor(autor: Autor): void {

    
    // Verificar que el autor existe
    if (!this.currentLibro.autores) {
      console.warn('No hay autores para eliminar');
      this.currentLibro.autores = [];
      return;
    }
    
    try {
      // Crear una nueva lista de autores (evita problemas de referencia)
      const nuevosAutores = this.currentLibro.autores.filter((a: any) => a.id !== autor.id);

      
      // Asignar el nuevo array para forzar la detección de cambios
      this.currentLibro.autores = [...nuevosAutores];
      
      // Notificar al usuario
      this.notificationService.info('Autor eliminado', { 
        description: `${autor.nombre} ${autor.apellido} eliminado del libro`
      });
      
      
    } catch (error) {
      console.error('Error al eliminar autor:', error);
      this.notificationService.error('Error', {
        description: 'No se pudo eliminar el autor del libro'
      });
    }
  }

  /**
   * Cancela la edición/creación de un libro
   */
  cancelEdit(): void {
    // Ocultar formulario y reiniciar estado
    this.showForm = false;
    this.isEditing = false;
    
    // Inicializar un nuevo libro con valores por defecto
    this.currentLibro = this.initializeLibro();
    this.verificarAutores(); // Asegurarse de que autores es un array vacío
    
    // Limpiar referencias de archivos y previsualizaciones
    this.selectedFile = null;
    this.previewPortadaUrl = null;
    
    // Limpiar estado de validación de ISBN duplicado
    this.isbnDuplicado = false;
    this.mensajeErrorIsbn = '';
    

  }

  /**
   * Cierra el panel de detalles del libro
   */
  closeDetails(): void {
    this.libroDetalle = null;
  }

  /**
   * Muestra el selector de autores
   */
  showAutorSelector(): void {
    // Verificar que el array de autores esté inicializado
    this.verificarAutores();
    
    this.showAutorSelectorModal = true;
    this.selectedAutorId = null;
    
    // Cargar la lista de autores si aún no se ha hecho
    if (this.allAutores.length === 0) {
      this.getAllAutores();
    }
  }

  /**
   * Crea un objeto libro con valores por defecto
   */
  private initializeLibro(): any {
    return {
      id: null,
      titulo: '',
      isbn: '',
      numeroPaginas: null,
      fechaPublicacion: null,
      sinopsis: '',
      portadaUrl: null,
      autores: []
    };
  }

  /**
   * Devuelve la fecha actual en formato ISO para usarla como valor máximo en inputs de tipo fecha
   */
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Maneja la selección de archivo de imagen para la portada del libro
   * @param event - Evento del input de tipo file
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) {
      return;
    }
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.warning('Archivo demasiado grande', { 
        description: 'La imagen no puede superar los 5MB'
      });
      event.target.value = '';
      return;
    }
    
    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      this.notificationService.error('Formato no válido', { 
        description: 'Solo se permiten imágenes en formato JPG o PNG'
      });
      event.target.value = '';
      return;
    }
    
    this.selectedFile = file;
    
    // Crear URL para previsualización
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewPortadaUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Método público para acceder a la URL de la imagen desde la plantilla
   * @param path Ruta relativa de la imagen
   * @returns URL completa para acceder a la imagen
   */
  getImageUrl(path: string | null): string {
    if (!path) {
      return this.libroPlaceholder;
    }
    return this.librosService.getImageUrl(path);
  }

  /**
   * Elimina la portada de un libro
   */
  eliminarPortada(): void {
    // Confirmar la eliminación
    this.notificationService.confirm({
      title: '¿Eliminar portada?',
      text: 'Esta acción establecerá una imagen predeterminada para el libro',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result) {
        // Si el usuario confirma, eliminamos la portada
        if (this.currentLibro.portadaUrl) {
          // Si la portada ya se había guardado en el servidor
          if (this.isEditing && this.currentLibro.id) {
            // Establecemos la URL a null (se usará la predeterminada)
            this.currentLibro.portadaUrl = null;
            this.previewPortadaUrl = this.libroPlaceholder;
            
            this.notificationService.success('Portada eliminada', { 
              description: 'Se ha establecido la imagen predeterminada'
            });
          } else {
            // Si el libro es nuevo, simplemente resetear
            this.currentLibro.portadaUrl = null;
            this.selectedFile = null;
            this.previewPortadaUrl = null;
          }
        }
      }
    });
  }

  /**
   * Valida que los datos del libro sean correctos antes de enviar
   * @returns True si el formulario es válido, false en caso contrario
   */
  formularioValido(): boolean {
    if (!this.currentLibro) return false;

    // Validar ISBN, páginas y sinopsis
    const isbnValido = !this.currentLibro.isbn || this.isValidISBN(this.currentLibro.isbn);
    const paginasValidas = !this.currentLibro.numeroPaginas || this.currentLibro.numeroPaginas > 0;
    const sinopsisValida = !this.currentLibro.sinopsis || this.currentLibro.sinopsis.length <= 1000;

    return isbnValido && paginasValidas && sinopsisValida;
  }

  /**
   * Valida si un ISBN tiene un formato válido (ISBN-10 o ISBN-13)
   * @param isbn - El ISBN a validar
   * @returns true si el ISBN es válido
   */
  isValidISBN(isbn: string): boolean {
    // Eliminar guiones y espacios
    isbn = isbn.replace(/[-\s]/g, '');
    
    // ISBN-10 (10 dígitos)
    if (/^(\d{9}[\dX])$/.test(isbn)) {
      // Calcular suma ponderada para ISBN-10
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(isbn.charAt(i)) * (10 - i);
      }
      const checksum = isbn.charAt(9).toUpperCase() === 'X' ? 10 : parseInt(isbn.charAt(9));
      return (sum + checksum) % 11 === 0;
    }
    
    // ISBN-13 (13 dígitos)
    if (/^\d{13}$/.test(isbn)) {
      // Calcular suma con factores alternantes 1 y 3
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(isbn.charAt(i)) * (i % 2 === 0 ? 1 : 3);
      }
      return (10 - (sum % 10)) % 10 === parseInt(isbn.charAt(12));
    }
    
    return false;
  }
  
  /**
   * Formatea un ISBN para mostrar guiones en las posiciones correctas
   * @param isbn - El ISBN a formatear
   * @returns ISBN formateado con guiones
   */
  formatISBN(isbn: string): string {
    isbn = isbn.replace(/[-\s]/g, '');
    if (isbn.length === 10) return `${isbn.substring(0, 1)}-${isbn.substring(1, 3)}-${isbn.substring(3, 9)}-${isbn.substring(9)}`;
    if (isbn.length === 13) return `${isbn.substring(0, 3)}-${isbn.substring(3, 4)}-${isbn.substring(4, 6)}-${isbn.substring(6, 12)}-${isbn.substring(12)}`;
    return isbn;
  }

  /**
   * Comprueba si el libro tiene autores asociados
   */
  hasAutores = (): boolean => 
    this.currentLibro && Array.isArray(this.currentLibro.autores) && this.currentLibro.autores.length > 0;
  
  /**
   * Comprueba si los autores están correctamente cargados y los inicializa si es necesario
   */
  verificarAutores(): void {
    // Inicializar libro y array de autores si es necesario
    if (!this.currentLibro) this.currentLibro = this.initializeLibro();
    if (!Array.isArray(this.currentLibro.autores)) this.currentLibro.autores = [];
    
    // Si hay autores, normalizar
    if (this.currentLibro.autores.length > 0) {
      this.currentLibro.autores = this.currentLibro.autores
        .filter((autor: any) => autor && typeof autor === 'object')
        .map((autor: any) => ({
          id: parseInt(autor.id) || null,
          nombre: autor.nombre || '',
          apellido: autor.apellido || '',
          fechaNacimiento: autor.fechaNacimiento || null,
          fechaFallecimiento: autor.fechaFallecimiento || null,
          biografia: autor.biografia || '',
          fotoUrl: autor.fotoUrl || null
        }))
        .filter((autor: any) => autor.id !== null);
    }
  }

  /**
   * Crea un nuevo libro
   * @param libroParaGuardar - Los datos del libro a crear
   * @param resolve - Función de resolución de la promesa
   * @param reject - Función de rechazo de la promesa
   */
  createLibro(libroParaGuardar: any, resolve: Function, reject: Function): void {

    
    this.librosService.createLibro(libroParaGuardar).subscribe({
      next: (response) => {

        
        // Si hay autores para asignar, los asignamos explícitamente
        const autoresIds = libroParaGuardar.autoresIds || [];
        if (response.id && autoresIds.length > 0) {

          
          this.librosService.assignAutoresToLibro(response.id, autoresIds).subscribe({
            next: () => {

              // Verificamos que se hayan guardado correctamente
              this.verificarAutoresGuardados(response.id, autoresIds);
            },
            error: (error) => {
              console.error(`[AdminLibros] Error al asignar autores al libro ${response.id}:`, error);
              this.notificationService.warning('Advertencia', {
                description: 'El libro se creó pero hubo un problema al guardar los autores.'
              });
            }
          });
        }
        
        this.notificationService.success('Libro creado', { 
          description: 'El libro se ha creado correctamente'
        });
        this.isUploading = false;
        this.getLibrosPaginados();
        this.cancelEdit();
        resolve();
      },
      error: (error) => {
        console.error('[AdminLibros] Error al crear libro:', error);
        this.isUploading = false;

        // Verificar si es un error de ISBN duplicado
        if (error.error && error.error.error === 'El ISBN ya existe en la base de datos') {
          this.isbnDuplicado = true;
          this.mensajeErrorIsbn = 'El ISBN ya existe en la base de datos';
          this.notificationService.error('Error de validación', { 
            description: 'El ISBN ingresado ya existe en la base de datos'
          });
        } else {
          this.notificationService.error('Error', { 
            description: 'No se pudo crear el libro. Por favor, intente nuevamente.'
          });
        }
        reject(error);
      }
    });
  }
  
  /**
   * Actualiza un libro existente
   * @param libroParaGuardar - Los datos del libro a actualizar
   * @param resolve - Función de resolución de la promesa
   * @param reject - Función de rechazo de la promesa
   */
  updateLibro(libroParaGuardar: any, resolve: Function, reject: Function): void {

    
    // Reiniciar estado de validación
    this.isbnDuplicado = false;
    this.mensajeErrorIsbn = '';
    
    // Usamos el nuevo método que maneja todo el proceso de actualización en una sola operación
    this.librosService.updateLibroConAutores(libroParaGuardar).subscribe({
      next: (response) => {

        
        // Verificamos que los autores se hayan guardado correctamente
        this.verificarAutoresGuardados(response.id, libroParaGuardar.autoresIds ?? []);
        
        // Mostrar mensaje de éxito
        this.notificationService.success('Libro actualizado', { 
          description: 'El libro se ha actualizado correctamente'
        });
        
        // Actualizar la lista de libros
        this.getLibrosPaginados();
        
        // Finalizar el proceso de carga
        this.isUploading = false;
        
        // Resolver la promesa
        resolve();
      },
      error: (error) => {
        console.error('[AdminLibros] Error al actualizar libro con autores:', error);
        this.isUploading = false;

        // Verificar si es un error de ISBN duplicado
        if (error.error && error.error.error === 'El ISBN ya existe en la base de datos') {
          this.isbnDuplicado = true;
          this.mensajeErrorIsbn = 'El ISBN ya existe en la base de datos';
          this.notificationService.error('Error de validación', { 
            description: 'El ISBN ingresado ya existe en la base de datos'
          });
        } else {
          this.notificationService.error('Error', { 
            description: 'No se pudo actualizar el libro. Por favor, intente nuevamente.'
          });
        }
        reject(error);
      }
    });
  }

  /**
   * Verifica si los autores se guardaron correctamente
   * @param libroId - ID del libro a verificar
   * @param autoresIdsEnviados - Array de IDs de autores que deberían estar asociados
   */
  verificarAutoresGuardados(libroId: number, autoresIdsEnviados: number[]): void {
    if (!libroId || !autoresIdsEnviados?.length) return;
    
    const autoresIdsOrdenados = [...autoresIdsEnviados].sort((a, b) => a - b);
    
    this.librosService.getAutoresByLibroId(libroId).subscribe({
      next: (autores) => {
        const autoresGuardadosIds = autores.map((autor: Autor) => autor.id).sort((a, b) => a - b);
        
        // Verificar concordancia entre lo enviado y lo guardado
        const todosGuardados = autoresIdsOrdenados.every(id => autoresGuardadosIds.includes(id));
        const mismaLongitud = autoresGuardadosIds.length === autoresIdsOrdenados.length;
        
        if (!todosGuardados || !mismaLongitud) {
          // En caso de discrepancias, mostrar advertencia
          this.notificationService.warning('Advertencia', { 
            description: 'Es posible que algunos autores no se hayan guardado correctamente'
          });
        }
      },
      error: (err) => {
        console.error(`[AdminLibros] Error al verificar autores: ${err}`);
      }
    });
  }

  /**
   * Prepara correctamente los datos del libro para enviar al backend,
   * asegurando que los autores se conviertan en un array de IDs
   * @param libroOriginal - El libro con todos los datos
   * @returns Un objeto libro preparado para el backend
   */
  prepararLibroParaEnviar(libroOriginal: any): any {
    try {
      const libroParaEnviar = JSON.parse(JSON.stringify(libroOriginal));
      
      // Extraer IDs de autores y eliminar datos completos
      libroParaEnviar.autoresIds = Array.isArray(libroParaEnviar.autores) 
        ? libroParaEnviar.autores.filter((a: any) => a?.id).map((a: any) => a.id) 
        : [];
      delete libroParaEnviar.autores;
      
      // Convertir número de páginas a numérico
      if (libroParaEnviar.numeroPaginas) libroParaEnviar.numeroPaginas = Number(libroParaEnviar.numeroPaginas);
      
      return libroParaEnviar;
    } catch (error) {
      console.error('[AdminLibros] Error al preparar libro para enviar:', error);
      const fallbackLibro = { ...libroOriginal, autoresIds: [] };
      delete fallbackLibro.autores;
      return fallbackLibro;
    }
  }

  /**
   * Limpia el error de ISBN duplicado cuando el usuario edita el campo
   */
  limpiarErrorIsbn(): void {
    if (this.isbnDuplicado) {
      this.isbnDuplicado = false;
      this.mensajeErrorIsbn = '';
    }
  }

  verDetalleLibro(libro: Libro): void {
    if (libro && libro.id) {
      this.router.navigate(['/libros', libro.id]);
    }
  }
}
