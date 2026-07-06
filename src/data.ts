import { Container, Warehouse } from './types';

export const DEFAULT_DIRECTORIO: Warehouse[] = [
  {
    seccion: '237',
    departamento: 'Damas Accesorios',
    jefeDepartamento: 'Armando Carrillo',
    nombreCorto: 'DM-ACC',
    piso: 'Planta Baja',
    bodega: 'Calz. Cab'
  },
  {
    seccion: '150',
    departamento: 'Electrónica y Línea Blanca',
    jefeDepartamento: 'Elena Ramos',
    nombreCorto: 'ELEC-LB',
    piso: 'Piso 1',
    bodega: 'Bodega Central B1'
  },
  {
    seccion: '180',
    departamento: 'Deportes Calzado',
    jefeDepartamento: 'Ricardo Peralta',
    nombreCorto: 'DEP-CALZ',
    piso: 'Piso 1',
    bodega: 'Bodega Anexa Norte'
  },
  {
    seccion: '310',
    departamento: 'Juguetería',
    jefeDepartamento: 'Gabriela Solís',
    nombreCorto: 'JUG-KIDS',
    piso: 'Piso 2',
    bodega: 'Estantería Lateral C'
  },
  {
    seccion: '420',
    departamento: 'Hogar y Decoración',
    jefeDepartamento: 'Santiago Medina',
    nombreCorto: 'HOG-DEC',
    piso: 'Piso 2',
    bodega: 'Bodega de Carga Central'
  },
  {
    seccion: '99',
    departamento: 'Perfumería Fina',
    jefeDepartamento: 'Patricia Loyo',
    nombreCorto: 'PERF-VIP',
    piso: 'Planta Baja',
    bodega: 'Cámara de Seguridad PB'
  }
];

export const DEFAULT_MANIFIESTO: Container[] = [
  {
    id: 'CONT-237-01',
    centro: 'CEDIS Tultitlán',
    manifiestoNum: 'MNF-98701',
    tarima: 'TAR-5510',
    seccion: '237',
    fechaMnf: '2026-07-06',
    cantidad: 85,
    estado: 'Pendiente'
  },
  {
    id: 'CONT-237-02',
    centro: 'CEDIS Tultitlán',
    manifiestoNum: 'MNF-98701',
    tarima: 'TAR-5511',
    seccion: '237',
    fechaMnf: '2026-07-06',
    cantidad: 120,
    estado: 'Pendiente'
  },
  {
    id: 'CONT-150-01',
    centro: 'CEDIS Huehuetoca',
    manifiestoNum: 'MNF-98702',
    tarima: 'TAR-6612',
    seccion: '150',
    fechaMnf: '2026-07-06',
    cantidad: 40,
    estado: 'Pendiente'
  },
  {
    id: 'CONT-150-02',
    centro: 'CEDIS Huehuetoca',
    manifiestoNum: 'MNF-98702',
    tarima: 'TAR-6613',
    seccion: '150',
    fechaMnf: '2026-07-06',
    cantidad: 55,
    estado: 'Pendiente'
  },
  {
    id: 'CONT-180-01',
    centro: 'CEDIS Tultitlán',
    manifiestoNum: 'MNF-98703',
    tarima: 'TAR-7714',
    seccion: '180',
    fechaMnf: '2026-07-05',
    cantidad: 300,
    estado: 'Pendiente'
  },
  {
    id: 'CONT-310-01',
    centro: 'CEDIS Guadalajara',
    manifiestoNum: 'MNF-98704',
    tarima: 'TAR-8815',
    seccion: '310',
    fechaMnf: '2026-07-05',
    cantidad: 180,
    estado: 'Pendiente'
  },
  {
    id: 'CONT-420-01',
    centro: 'CEDIS Guadalajara',
    manifiestoNum: 'MNF-98704',
    tarima: 'TAR-8816',
    seccion: '420',
    fechaMnf: '2026-07-06',
    cantidad: 95,
    estado: 'Pendiente'
  }
];
