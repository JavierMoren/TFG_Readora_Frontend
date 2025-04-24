// Importación de la interfaz Autor
import { Autor } from '../autor/autor.model';

export interface Libro {
  id: number;
  titulo: string;
  isbn: string | null;
  editorial: string | null;
  anioPublicacion: Date | null; 
  genero: string | null;
  portada: string | null;
  autores?: Autor[];
}

