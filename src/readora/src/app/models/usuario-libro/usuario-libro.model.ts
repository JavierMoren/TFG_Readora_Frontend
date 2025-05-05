export interface UsuarioLibro {
    id?: number; 
    usuarioId: number;
    libroId: number;
    estadoLectura: string; // LEYENDO, TERMINADO, PENDIENTE, ABANDONADO
    valoracion: number | null; // 1-5
    comentario: string | null;
    fechaInicioLectura: Date | null;
    fechaFinLectura: Date | null;
}