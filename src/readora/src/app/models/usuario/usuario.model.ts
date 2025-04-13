export interface Usuario {
    id: number;
    usuario: string;
    nombre: string;
    apellido: string;
    gmail: string;
    contrasenna: string;
    enabled: boolean;
    fechaCreacion: Date;
}