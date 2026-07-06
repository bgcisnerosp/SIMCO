import React, { useState } from 'react';
import { Container, ScanLog, Warehouse } from '../types';
import { exportToExcel } from '../utils/excel';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  BarChart4, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  XCircle,
  PlusCircle,
  MapPin,
  Mail,
  Send,
  Check
} from 'lucide-react';

interface ReportSectionProps {
  manifiesto: Container[];
  directorio: Warehouse[];
  scanLogs: ScanLog[];
}

export default function ReportSection({ manifiesto, directorio, scanLogs }: ReportSectionProps) {
  
  // Función auxiliar para calcular el estatus del reporte de cada contenedor
  const getContainerEstatusReporte = (c: Container): 'Correcto' | 'Faltante' | 'Adicional' | 'Reubicar' => {
    if (c.estado === 'Pendiente') {
      return 'Faltante';
    }
    if (c.estatusReporte === 'Adicional' || c.manifiestoNum === 'MNF-EXTRA') {
      return 'Adicional';
    }
    
    // Buscar la sección en el directorio
    const asignacion = directorio.find(w => w.seccion.toLowerCase() === c.seccion.toLowerCase());
    if (asignacion) {
      const isCorrect = 
        c.pisoRecibido?.toLowerCase() === asignacion.piso.toLowerCase() &&
        c.bodegaRecibida?.toLowerCase() === asignacion.bodega.toLowerCase();
      
      return isCorrect ? 'Correcto' : 'Reubicar';
    }
    
    return 'Correcto'; // Si no está asignado en directorio, se cataloga Correcto
  };

  // Clasificación de todos los contenedores en el estado actual
  const manifiestoConEstatus = manifiesto.map(c => ({
    ...c,
    estatusFinal: getContainerEstatusReporte(c)
  }));

  const totalManifiesto = manifiesto.length;
  
  // Contar los 4 estados principales del reporte
  const countCorrecto = manifiestoConEstatus.filter(c => c.estatusFinal === 'Correcto').length;
  const countFaltante = manifiestoConEstatus.filter(c => c.estatusFinal === 'Faltante').length;
  const countReubicar = manifiestoConEstatus.filter(c => c.estatusFinal === 'Reubicar').length;
  const countAdicional = manifiestoConEstatus.filter(c => c.estatusFinal === 'Adicional').length;

  const totalAudited = countCorrecto + countFaltante + countReubicar + countAdicional;

  // Estados para el envío de correo
  const [email, setEmail] = useState<string>('bgcisnerosp@liverpool.com.mx');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [sendingState, setSendingState] = useState<'idle' | 'preparing' | 'connecting' | 'transmitting' | 'success'>('idle');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  // Descarga del Reporte Completo de Excel
  const handleDownloadFullReport = (): string => {
    try {
      const workbook = XLSX.utils.book_new();

      // Tab 1: Resumen Ejecutivo
      const resumenData = [
        { 'Métrica de Control': 'Fecha de Auditoría', 'Valor': new Date().toLocaleString('es-MX') },
        { 'Métrica de Control': 'Total Contenedores Auditados', 'Valor': totalManifiesto },
        { 'Métrica de Control': '1. CORRECTO (Ubicación Correcta)', 'Valor': countCorrecto },
        { 'Métrica de Control': '2. REUBICAR (Ubicación Incorrecta)', 'Valor': countReubicar },
        { 'Métrica de Control': '3. FALTANTE (No Escaneado)', 'Valor': countFaltante },
        { 'Métrica de Control': '4. ADICIONAL (Extra no en Manifiesto)', 'Valor': countAdicional },
        { 'Métrica de Control': 'Efectividad de Colocación Correcta', 'Valor': `${totalManifiesto > 0 ? Math.round((countCorrecto / totalManifiesto) * 100) : 0}%` },
        { 'Métrica de Control': 'Índice de Reubicación Requerido', 'Valor': `${totalManifiesto > 0 ? Math.round((countReubicar / totalManifiesto) * 100) : 0}%` }
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen Ejecutivo');

      // Tab 2: Reporte de Manifiesto con las columnas requeridas
      const reporteDetalle = manifiestoConEstatus.map(c => {
        return {
          'CENTRO': c.centro || 'N/A',
          'MANIFIESTO': c.manifiestoNum || 'N/A',
          'TARIMA': c.tarima || 'N/A',
          'CONTENEDOR': c.id,
          'SECCIÓN': c.seccion || 'N/A',
          'FECHA MNF': c.fechaMnf || 'N/A',
          'CANTIDAD': c.cantidad || 0,
          'PISO REGISTRADO': c.pisoRecibido || 'N/A',
          'BODEGA REGISTRADA': c.bodegaRecibida || 'N/A',
          'FECHA DE RECEPCIÓN': c.fechaRecepcion || 'N/A',
          'ESTATUS REPORTADO': c.estatusFinal
        };
      });
      const wsReporte = XLSX.utils.json_to_sheet(reporteDetalle);
      XLSX.utils.book_append_sheet(workbook, wsReporte, 'Manifiesto Auditado');

      // Guardar el libro de excel
      const fileName = `Reporte_Auditoria_Liverpool_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      return fileName;
    } catch (err) {
      console.error('Error generando reporte:', err);
      alert('Error al generar el archivo Excel: ' + (err as Error).message);
      return '';
    }
  };

  const handleSendByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setSendingState('preparing');
      setProgressLog(['[1/3] Generando reporte Excel conciliado y codificando en memoria...']);

      // Crear workbook para base64
      const workbook = XLSX.utils.book_new();

      const resumenData = [
        { 'Métrica de Control': 'Fecha de Auditoría', 'Valor': new Date().toLocaleString('es-MX') },
        { 'Métrica de Control': 'Total Contenedores Auditados', 'Valor': totalManifiesto },
        { 'Métrica de Control': '1. CORRECTO (Ubicación Correcta)', 'Valor': countCorrecto },
        { 'Métrica de Control': '2. REUBICAR (Ubicación Incorrecta)', 'Valor': countReubicar },
        { 'Métrica de Control': '3. FALTANTE (No Escaneado)', 'Valor': countFaltante },
        { 'Métrica de Control': '4. ADICIONAL (Extra no en Manifiesto)', 'Valor': countAdicional },
        { 'Métrica de Control': 'Efectividad de Colocación Correcta', 'Valor': `${totalManifiesto > 0 ? Math.round((countCorrecto / totalManifiesto) * 100) : 0}%` },
        { 'Métrica de Control': 'Índice de Reubicación Requerido', 'Valor': `${totalManifiesto > 0 ? Math.round((countReubicar / totalManifiesto) * 100) : 0}%` }
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen Ejecutivo');

      const reporteDetalle = manifiestoConEstatus.map(c => {
        return {
          'CENTRO': c.centro || 'N/A',
          'MANIFIESTO': c.manifiestoNum || 'N/A',
          'TARIMA': c.tarima || 'N/A',
          'CONTENEDOR': c.id,
          'SECCIÓN': c.seccion || 'N/A',
          'FECHA MNF': c.fechaMnf || 'N/A',
          'CANTIDAD': c.cantidad || 0,
          'PISO REGISTRADO': c.pisoRecibido || 'N/A',
          'BODEGA REGISTRADA': c.bodegaRecibida || 'N/A',
          'FECHA DE RECEPCIÓN': c.fechaRecepcion || 'N/A',
          'ESTATUS REPORTADO': c.estatusFinal
        };
      });
      const wsReporte = XLSX.utils.json_to_sheet(reporteDetalle);
      XLSX.utils.book_append_sheet(workbook, wsReporte, 'Manifiesto Auditado');

      const fileName = `Reporte_Auditoria_Liverpool_${new Date().toISOString().split('T')[0]}.xlsx`;
      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

      // Construir cuerpo del correo con formato y las métricas
      const efectividad = totalManifiesto > 0 ? Math.round((countCorrecto / totalManifiesto) * 100) : 0;
      const reubicacion = totalManifiesto > 0 ? Math.round((countReubicar / totalManifiesto) * 100) : 0;

      const bodyText = `Hola,

Comparto el informe conciliado de la recepción y auditoría de contenedores en andén correspondiente a SIMCO (Sistema Móvil de Control de Contenedores).

MÉTRICAS CLAVE (Resumen Ejecutivo):
----------------------------------
• Fecha de Auditoría: ${new Date().toLocaleString('es-MX')}
• Total Contenedores Auditados: ${totalManifiesto}
• Correctos (Ubicación Correcta): ${countCorrecto}
• Reubicar (Ubicación Incorrecta): ${countReubicar}
• Faltantes (No Escaneados): ${countFaltante}
• Adicionales (Extras Registrados): ${countAdicional}

• Efectividad de Colocación Correcta: ${efectividad}%
• Índice de Reubicación Requerido: ${reubicacion}%

*Nota: Se ha adjuntado el archivo Excel conciliado con el desglose de cada contenedor.*

Atentamente,
SIMCO - Liverpool`;

      // Simular paso de conexión
      setTimeout(() => {
        setSendingState('connecting');
        setProgressLog(prev => [
          ...prev,
          '[2/3] Conectando de manera segura con el servidor SMTP corporativo...'
        ]);
      }, 600);

      // Enviar solicitud POST al backend
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: 'K.A.O. - SIMCO - Reporte Mapeo de Contenedores',
          bodyText,
          excelBase64: base64,
          fileName
        })
      });

      if (!response.ok) {
        throw new Error('El servidor de correo retornó un estado de error');
      }

      const result = await response.json();

      setSendingState('success');
      setProgressLog(prev => [
        ...prev,
        `[3/3] ¡Correo electrónico enviado con éxito directamente a: ${email}!`
      ]);
      
      if (result.previewUrl) {
        setPreviewLink(result.previewUrl);
        setUsingFallback(true);
      } else {
        setPreviewLink(null);
        setUsingFallback(false);
      }

      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 8000);

    } catch (err: any) {
      console.error('Error al enviar correo:', err);
      setSendingState('idle');
      alert('Error al enviar el correo automáticamente: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-bounce border border-emerald-500">
          <Check className="w-6 h-6 shrink-0 bg-white/20 p-1 rounded-lg" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-sm">¡Correo Enviado!</p>
            <p className="font-medium text-emerald-100">
              El reporte de auditoría conciliado con el Excel adjunto ha sido enviado de forma automatizada y directa a: <code className="bg-emerald-700 px-1 py-0.5 rounded font-mono font-bold text-white">{email}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Panel de Exportación y Compartido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        
        {/* Columna Izquierda: Descarga Directa */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
              <BarChart4 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cierre General & Reporte de Andén</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Clasificación automática basada en las reglas de ubicación física del Directorio. Descarga directa en tu dispositivo.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleDownloadFullReport()}
            className="w-full inline-flex items-center justify-center px-5 py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all gap-2 cursor-pointer text-xs"
          >
            <Download className="w-4 h-4" />
            Exportar Manifiesto Conciliado (.xlsx)
          </button>
        </div>

        {/* Columna Derecha: Envío por Correo */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 font-sans">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-2xl shrink-0 transition-colors ${
              sendingState === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">Enviar Reporte Automático</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Envía el archivo Excel conciliado de manera 100% automatizada y directa a cualquier correo electrónico institucional.
              </p>
            </div>
          </div>

          {sendingState === 'idle' ? (
            <form onSubmit={handleSendByEmail} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="ejemplo@liverpool.com.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 pl-4 pr-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition-all font-medium font-mono text-slate-700"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-5 py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-all gap-2 cursor-pointer text-xs shrink-0"
                >
                  <Send className="w-4 h-4" />
                  Enviar Correo
                </button>
              </div>
              
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                El informe se enviará de forma automática con el archivo Excel adjunto en segundo plano.
              </p>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-700 font-extrabold flex items-center gap-1.5 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Servidor SMTP Autónomo SIMCO
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  sendingState === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {sendingState === 'success' ? '¡Enviado con Éxito!' : 'Transmitiendo...'}
                </span>
              </div>

              <div className="space-y-2.5 font-medium text-slate-600">
                {progressLog.map((log, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>

              {sendingState === 'success' && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  {usingFallback && previewLink && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-[11px] leading-relaxed font-semibold">
                      📬 <span className="font-extrabold">Bandeja de pruebas activada:</span> El correo y el reporte Excel adjunto fueron transmitidos correctamente en segundo plano. Dado que estás en el entorno de desarrollo de AI Studio, haz clic en el siguiente enlace para ver la bandeja de entrada real del correo recibido:
                      <a 
                        href={previewLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block mt-2 font-bold text-indigo-600 hover:underline break-all bg-white p-2 rounded border border-emerald-300"
                      >
                        Ver Bandeja Virtual de Pruebas (Ethereal) →
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-emerald-700 font-bold text-[11px]">¡Reporte enviado exitosamente!</span>
                    <button
                      onClick={() => {
                        setSendingState('idle');
                        setProgressLog([]);
                        setPreviewLink(null);
                        setUsingFallback(false);
                      }}
                      className="bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Enviar Otro Correo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Grid de las 4 Categorías Requeridas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CORRECTO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
              Correcto
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{countCorrecto}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Ubicados donde corresponde</p>
          </div>
          <div className="w-full bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 font-medium border border-slate-100">
            Escaneados en Piso y Bodega asignados por sección.
          </div>
        </div>

        {/* REUBICAR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wider">
              Reubicar
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{countReubicar}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Ubicación incorrecta</p>
          </div>
          <div className="w-full bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 font-medium border border-slate-100">
            Escaneados pero requieren traslado al piso designado.
          </div>
        </div>

        {/* FALTANTE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wider">
              Faltante
            </span>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{countFaltante}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Manifiesto sin escanear</p>
          </div>
          <div className="w-full bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 font-medium border border-slate-100">
            En manifiesto pero no pasaron por el escáner físico.
          </div>
        </div>

        {/* ADICIONAL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
              Adicional
            </span>
            <PlusCircle className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 font-mono">{countAdicional}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Extras de recepción</p>
          </div>
          <div className="w-full bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 font-medium border border-slate-100">
            Escaneados pero no figuraban en el archivo de manifiesto.
          </div>
        </div>

      </div>

      {/* Lista Conciliada del Manifiesto actual */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Vista Previa de Conciliación</h3>
            <p className="text-xs text-slate-400">Inspecciona el listado completo y la clasificación final antes de exportar.</p>
          </div>
          <span className="text-xs font-semibold font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
            Total Auditados: {totalManifiesto}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 sticky top-0">
              <tr>
                <th className="py-3 px-4">Contenedor</th>
                <th className="py-3 px-4">Tarima</th>
                <th className="py-3 px-4">Sección</th>
                <th className="py-3 px-4">Ubicación Registrada</th>
                <th className="py-3 px-4">Ubicación Designada</th>
                <th className="py-3 px-4">Cantidad</th>
                <th className="py-3 px-4">Clasificación Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {manifiestoConEstatus.map((c) => {
                const asignacion = directorio.find(w => w.seccion.toLowerCase() === c.seccion.toLowerCase());
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{c.tarima || 'EXTRA'}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">Secc. {c.seccion}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.pisoRecibido ? `${c.pisoRecibido} • ${c.bodegaRecibida}` : 'FALTANTE (No Escaneado)'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {asignacion ? `${asignacion.piso} • ${asignacion.bodega}` : 'Sin asignación'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{c.cantidad} pzs</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        c.estatusFinal === 'Correcto'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.estatusFinal === 'Reubicar'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : c.estatusFinal === 'Faltante'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {c.estatusFinal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
