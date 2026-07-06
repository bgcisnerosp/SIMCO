import { useState, useEffect } from 'react';
import { Container, Warehouse, ScanLog } from './types';
import { DEFAULT_MANIFIESTO, DEFAULT_DIRECTORIO } from './data';
import UploadSection from './components/UploadSection';
import MetricsCards from './components/MetricsCards';
import ActiveReception from './components/ActiveReception';
import DataExplorer from './components/DataExplorer';
import ReportSection from './components/ReportSection';
import { 
  Building2, 
  Database, 
  Scan, 
  BarChart4, 
  CheckCircle, 
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recepcion' | 'carga' | 'explorer' | 'reporte'>('recepcion');
  
  // Inicialización de Estados leyendo de LocalStorage
  const [manifiesto, setManifiesto] = useState<Container[]>(() => {
    const saved = localStorage.getItem('recepcion_manifiesto');
    return saved ? JSON.parse(saved) : DEFAULT_MANIFIESTO;
  });

  const [directorio, setDirectorio] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('recepcion_directorio');
    return saved ? JSON.parse(saved) : DEFAULT_DIRECTORIO;
  });

  const [scanLogs, setScanLogs] = useState<ScanLog[]>(() => {
    const saved = localStorage.getItem('recepcion_scan_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en localStorage cuando cambien los estados
  useEffect(() => {
    localStorage.setItem('recepcion_manifiesto', JSON.stringify(manifiesto));
  }, [manifiesto]);

  useEffect(() => {
    localStorage.setItem('recepcion_directorio', JSON.stringify(directorio));
  }, [directorio]);

  useEffect(() => {
    localStorage.setItem('recepcion_scan_logs', JSON.stringify(scanLogs));
  }, [scanLogs]);

  // Manejadores de cambios
  const handleUpdateManifiesto = (data: Container[]) => {
    setManifiesto(data);
    // Reiniciar logs si cambian la base para evitar inconsistencias
    setScanLogs([]);
  };

  const handleUpdateDirectorio = (data: Warehouse[]) => {
    setDirectorio(data);
  };

  const handleResetPresets = () => {
    if (confirm('¿Estás seguro de que quieres restaurar los datos de demostración? Se borrará el progreso actual.')) {
      setManifiesto(DEFAULT_MANIFIESTO);
      setDirectorio(DEFAULT_DIRECTORIO);
      setScanLogs([]);
      setActiveTab('recepcion');
    }
  };

  const handleAddScanLog = (log: ScanLog) => {
    setScanLogs((prev) => [log, ...prev]);
  };

  const handleRemoveScanLog = (id: string) => {
    const logToRemove = scanLogs.find((l) => l.id === id);
    if (!logToRemove) return;

    // Si el log fue exitoso, devolver el estado del contenedor a Pendiente
    if (logToRemove.estado === 'Exitoso') {
      setManifiesto((prev) =>
        prev.map((c) =>
          c.id.toLowerCase() === logToRemove.contenedorId.toLowerCase()
            ? { ...c, estado: 'Pendiente', pisoRecibido: undefined, bodegaRecibida: undefined, fechaRecepcion: undefined }
            : c
        )
      );
    }

    setScanLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateContainerStatus = (
    containerId: string,
    status: Container['estado'],
    piso?: string,
    bodega?: string,
    estatusReporte?: Container['estatusReporte']
  ) => {
    setManifiesto((prev) =>
      prev.map((c) =>
        c.id.toLowerCase() === containerId.toLowerCase()
          ? {
              ...c,
              estado: status,
              pisoRecibido: piso,
              bodegaRecibida: bodega,
              fechaRecepcion: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
              estatusReporte: estatusReporte
            }
          : c
      )
    );
  };

  const handleAddContainerToManifiesto = (newContainer: Container) => {
    setManifiesto((prev) => [newContainer, ...prev]);
  };

  // Contenedores extras recibidos (que no estaban originalmente en el manifiesto)
  const unregisteredCount = scanLogs.filter(log => log.estado === 'No Registrado').length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      
      {/* Barra de Navegación Principal */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo e Identidad */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  K.A.O. - SIMCO
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">SISTEMA MAPEO DE CONTENEDORES</p>
              </div>
            </div>

            {/* APK Info / Help Badge */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                Listo para Instalar como App Móvil
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Informativo sobre APK */}
        <div className="bg-gradient-to-r from-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 relative z-10">
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-500 text-white rounded-md tracking-wider">PROCESAMIENTO OFFLINE</span>
            <h2 className="text-base font-bold tracking-tight">¡Esta Web App funciona en tu celular igual que una APK!</h2>
            <p className="text-xs text-indigo-150 max-w-2xl">
              Diseño 100% responsivo para lectores de código y celulares. Puedes "Añadir a la pantalla de inicio" desde tu navegador móvil para tener un ícono directo e instalarla de forma inmediata (PWA), o compilarla como APK nativa con Capacitor.
            </p>
          </div>
          
          <div className="flex gap-2 relative z-10 shrink-0">
            <a 
              href="#guia-apk" 
              onClick={() => {
                alert(
                  'Instrucciones para tener la App en tu Celular (PWA/APK):\n\n' +
                  '1️⃣ Abre este link en tu celular (Safari en iPhone o Chrome en Android).\n' +
                  '2️⃣ En Android: Toca los 3 puntos arriba a la derecha y selecciona "Instalar aplicación" o "Añadir a la pantalla de inicio".\n' +
                  '3️⃣ En iPhone (iOS): Toca el botón de "Compartir" abajo al centro y selecciona "Añadir a pantalla de inicio".\n\n' +
                  '¡Listo! Tendrás un ícono de acceso directo en tu celular y se ejecutará en pantalla completa de forma offline.'
                );
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow shadow-indigo-900 cursor-pointer"
            >
              Guía de Instalación Móvil
            </a>
          </div>

          {/* Círculo decorativo de fondo */}
          <div className="absolute right-[-10%] top-[-50%] w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        </div>

        {/* Tab Selector Nav */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 py-1 scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('recepcion')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'recepcion'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Scan className="w-4 h-4" />
            Escanear Recepción
          </button>

          <button
            onClick={() => setActiveTab('carga')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'carga'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            Cargar Bases (Excel)
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'explorer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Consultar Manifiesto & Bodegas
          </button>

          <button
            onClick={() => setActiveTab('reporte')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'reporte'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart4 className="w-4 h-4" />
            Cierre & Reporte Excel
          </button>
        </div>

        {/* Panel de KPI Cards en la parte superior para contextualizar */}
        <MetricsCards 
          manifiesto={manifiesto} 
          scanCount={scanLogs.length} 
          unregisteredCount={unregisteredCount} 
        />

        {/* Renderizado Dinámico de Vistas */}
        <div className="transition-all duration-350">
          {activeTab === 'recepcion' && (
            <ActiveReception
              manifiesto={manifiesto}
              directorio={directorio}
              scanLogs={scanLogs}
              onAddScanLog={handleAddScanLog}
              onRemoveScanLog={handleRemoveScanLog}
              onUpdateContainerStatus={handleUpdateContainerStatus}
              onAddContainerToManifiesto={handleAddContainerToManifiesto}
            />
          )}

          {activeTab === 'carga' && (
            <UploadSection
              onUpdateManifiesto={handleUpdateManifiesto}
              onUpdateDirectorio={handleUpdateDirectorio}
              onResetPresets={handleResetPresets}
              manifiestoCount={manifiesto.length}
              directorioCount={directorio.length}
            />
          )}

          {activeTab === 'explorer' && (
            <DataExplorer 
              manifiesto={manifiesto} 
              directorio={directorio} 
            />
          )}

          {activeTab === 'reporte' && (
            <ReportSection
              manifiesto={manifiesto}
              directorio={directorio}
              scanLogs={scanLogs}
            />
          )}
        </div>

      </main>

      {/* Footer Fijo */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-500">K.A.O. - SIMCO v1.0.0 — Optimizado para Terminales Móviles y Lectores Láser</p>
          <p>© 2026 Liverpool — Soluciones Digitales de Logística y Almacén. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
