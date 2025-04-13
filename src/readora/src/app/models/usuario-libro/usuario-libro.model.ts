export interface UsuarioLibro {
    id: number;
    usuarioId: number;
    libroId: number;
    estadoLectura: string;
    valoracion: number;
    comentario: string;
    fechaInicio: Date;
    fechaFin: Date;
} 