export interface Autor {
    id: number;
    nombre: string;
    apellido: string;
    fechaNacimiento?: Date;
    fechaFallecimiento?: Date;
    nacionalidad?: string;
    biografia?: string;
    fotoUrl?: string;
    libros?: any[];
}