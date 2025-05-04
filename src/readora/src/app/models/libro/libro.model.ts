// Importación de la interfaz Autor
import { Autor } from '../autor/autor.model';

export interface Libro {
  id: number;
  titulo: string;
  isbn: string | null;
  editorial: string | null;
  anioPublicacion: Date | null; 
  genero: string | null;
  sinopsis: string | null;
  portadaUrl: string | null;
  numeroPaginas: number | null;
  autor?: Autor; // Para mostrar info del autor principal en la UI
  autores?: Autor[];
}

