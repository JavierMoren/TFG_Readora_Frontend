export interface Autor {
    id: number;
    nombre: string;
    apellido: string;
    fechaNacimiento?: Date;
    fechaFallecimiento?: Date;
    nacionalidad?: string;
    biografia?: string;
    fotoUrl?: string | null;  // Permitir null además de undefined
    libros?: any[];
}