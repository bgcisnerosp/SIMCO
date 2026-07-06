export interface Container {
  id: string; // CONTENEDOR (Código de barras para escaneo)
  centro: string; // CENTRO
  manifiestoNum: string; // MANIFIESTO
  tarima: string; // TARIMA
  seccion: string; // SECCIÓN (Cruza con el Directorio)
  fechaMnf: string; // FECHA MNF
  cantidad: number; // CANTIDAD esperada
  estado: 'Pendiente' | 'Recibido' | 'Adicional';
  pisoRecibido?: string; // Dónde se escaneó
  bodegaRecibida?: string; // Dónde se escaneó
  fechaRecepcion?: string; // Cuándo se escaneó
  estatusReporte?: 'Correcto' | 'Faltante' | 'Adicional' | 'Reubicar'; // Clasificación final
}

export interface Warehouse {
  seccion: string; // SECCIÓN
  departamento: string; // DEPARTAMENTO
  jefeDepartamento: string; // JEFE DE DEPARTAMENTO
  nombreCorto: string; // NOMBRE CORTO
  piso: string; // PISO (1, 2, 3 o "Planta Baja", etc.)
  bodega: string; // BODEGA (e.g. "Calz. Cab")
}

export interface ScanLog {
  id: string; // ID único del log
  contenedorId: string;
  piso: string;
  bodega: string;
  fecha: string; // Hora en formato legible hh:mm:ss
  estado: 'Exitoso' | 'Duplicado' | 'No Registrado' | 'Reubicar';
  seccion?: string;
  tarima?: string;
  cantidad?: number;
}
