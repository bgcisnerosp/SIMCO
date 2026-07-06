import * as XLSX from 'xlsx';
import { Container, Warehouse } from '../types';

/**
 * Parsea un archivo de Excel (.xls o .xlsx) cargado por el usuario
 * y devuelve un arreglo de objetos JSON representando las filas.
 */
export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        console.error('Error parsing excel file:', err);
        reject(new Error('Formato de archivo no válido o dañado. Asegúrate de que sea un .xls o .xlsx válido.'));
      }
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

/**
 * Exporta un arreglo de datos JSON a un archivo de Excel (.xlsx) de forma local.
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Datos') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (err) {
    console.error('Error exporting to excel:', err);
    alert('Error al exportar archivo: ' + (err as Error).message);
  }
};

/**
 * Descarga una plantilla de Excel para el Manifiesto con la disposición de columnas A-G.
 */
export const downloadManifiestoTemplate = () => {
  const templateData = [
    {
      'CENTRO': 'CEDIS Tultitlán',
      'MANIFIESTO': 'MNF-10020',
      'TARIMA': 'TAR-9011',
      'CONTENEDOR': 'CONT-237-99',
      'SECCIÓN': '237',
      'FECHA MNF': '2026-07-06',
      'CANTIDAD': 150
    },
    {
      'CENTRO': 'CEDIS Tultitlán',
      'MANIFIESTO': 'MNF-10020',
      'TARIMA': 'TAR-9012',
      'CONTENEDOR': 'CONT-150-88',
      'SECCIÓN': '150',
      'FECHA MNF': '2026-07-06',
      'CANTIDAD': 85
    }
  ];
  exportToExcel(templateData, 'Plantilla_Manifiesto_Disposicion_A-G', 'Manifiesto');
};

/**
 * Descarga una plantilla de Excel para el Directorio con la disposición de columnas A-F.
 */
export const downloadDirectorioTemplate = () => {
  const templateData = [
    {
      'SECCIÓN': '237',
      'DEPARTAMENTO': 'Damas Accesorios',
      'JEFE DE DEPARTAMENTO': 'Armando Carrillo',
      'NOMBRE CORTO': 'DM-ACC',
      'PISO': 'Planta Baja',
      'BODEGA': 'Calz. Cab'
    },
    {
      'SECCIÓN': '150',
      'DEPARTAMENTO': 'Electrónica y Línea Blanca',
      'JEFE DE DEPARTAMENTO': 'Elena Ramos',
      'NOMBRE CORTO': 'ELEC-LB',
      'PISO': 'Piso 1',
      'BODEGA': 'Bodega Central B1'
    }
  ];
  exportToExcel(templateData, 'Plantilla_Directorio_Disposicion_A-F', 'Directorio');
};

/**
 * Mapea las columnas del excel parseado al formato Container de la app.
 */
export const mapExcelToManifiesto = (rows: any[]): Container[] => {
  const mapped = rows.map((row) => {
    const id = row['CONTENEDOR'] || row['Contenedor'] || row['contenedor'] || Object.values(row)[3] || Object.values(row)[0];
    const centro = row['CENTRO'] || row['Centro'] || row['centro'] || '';
    const manifiestoNum = row['MANIFIESTO'] || row['Manifiesto'] || row['manifiesto'] || '';
    const tarima = row['TARIMA'] || row['Tarima'] || row['tarima'] || '';
    const seccionRaw = row['SECCIÓN'] || row['SECCION'] || row['Sección'] || row['Seccion'] || '';
    const fechaMnf = row['FECHA MNF'] || row['Fecha Mnf'] || row['FECHA'] || row['Fecha'] || '';
    const cantidadStr = row['CANTIDAD'] || row['Cantidad'] || row['cantidad'] || 0;
    const cantidad = isNaN(Number(cantidadStr)) ? 0 : Number(cantidadStr);

    return {
      id: String(id).trim(),
      centro: String(centro).trim(),
      manifiestoNum: String(manifiestoNum).trim(),
      tarima: String(tarima).trim(),
      seccion: String(seccionRaw).trim(),
      fechaMnf: String(fechaMnf).trim(),
      cantidad,
      estado: 'Pendiente' as const
    };
  }).filter(c => c.id && c.id !== 'undefined' && c.id !== '');

  // Filtrar duplicados por ID (ignorando mayúsculas/minúsculas)
  const seen = new Set<string>();
  return mapped.filter((container) => {
    const key = container.id.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Mapea las columnas del excel parseado al formato Warehouse de la app.
 */
export const mapExcelToDirectorio = (rows: any[]): Warehouse[] => {
  return rows.map((row) => {
    const seccionRaw = row['SECCIÓN'] || row['SECCION'] || row['Sección'] || row['Seccion'] || Object.values(row)[0] || '';
    const departamento = row['DEPARTAMENTO'] || row['Departamento'] || row['departamento'] || '';
    const jefeDepartamento = row['JEFE DE DEPARTAMENTO'] || row['Jefe de Departamento'] || row['JEFE'] || row['jefe'] || '';
    const nombreCorto = row['NOMBRE CORTO'] || row['Nombre Corto'] || row['nombre corto'] || '';
    const piso = row['PISO'] || row['Piso'] || row['piso'] || '';
    const bodega = row['BODEGA'] || row['Bodega'] || row['bodega'] || '';

    return {
      seccion: String(seccionRaw).trim(),
      departamento: String(departamento).trim(),
      jefeDepartamento: String(jefeDepartamento).trim(),
      nombreCorto: String(nombreCorto).trim(),
      piso: String(piso).trim(),
      bodega: String(bodega).trim()
    };
  }).filter(w => w.seccion && w.seccion !== 'undefined' && w.seccion !== '' && w.bodega !== '');
};
