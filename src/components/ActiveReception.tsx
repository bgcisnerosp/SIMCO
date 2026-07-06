import React, { useState, useEffect, useRef } from 'react';
import { Container, Warehouse, ScanLog } from '../types';
import { playSuccessBeep, playWarningBeep, playErrorBeep, speakText } from '../utils/audio';
import { 
  Building2, 
  Scan, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  History, 
  Trash2,
  Lock,
  Unlock,
  CornerDownLeft,
  Plus,
  HelpCircle,
  MapPin
} from 'lucide-react';

interface ActiveReceptionProps {
  manifiesto: Container[];
  directorio: Warehouse[];
  scanLogs: ScanLog[];
  onAddScanLog: (log: ScanLog) => void;
  onRemoveScanLog: (id: string) => void;
  onUpdateContainerStatus: (
    containerId: string, 
    status: Container['estado'], 
    piso?: string, 
    bodega?: string, 
    estatusReporte?: Container['estatusReporte']
  ) => void;
  onAddContainerToManifiesto: (container: Container) => void;
}

export default function ActiveReception({
  manifiesto,
  directorio,
  scanLogs,
  onAddScanLog,
  onRemoveScanLog,
  onUpdateContainerStatus,
  onAddContainerToManifiesto,
}: ActiveReceptionProps) {
  const [selectedPiso, setSelectedPiso] = useState<string>('');
  const [selectedBodega, setSelectedBodega] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState<boolean>(true);
  
  // Guardar el estado del último escaneo para mostrar retroalimentación visual gigante
  const [lastScanResult, setLastScanResult] = useState<{
    id: string;
    estado: 'Exitoso' | 'Duplicado' | 'No Registrado' | 'Reubicar';
    mensaje: string;
    detalle?: string;
    pisoAsignado?: string;
    bodegaAsignada?: string;
    seccion?: string;
  } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Extraer pisos dinámicamente desde el directorio actual
  const pisosDisponibles = Array.from(new Set(directorio.map((w) => w.piso)))
    .filter((p) => p !== undefined && p !== '')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const pisos = pisosDisponibles.length > 0 ? pisosDisponibles : ['Planta Baja', 'Piso 1', 'Piso 2'];

  // Filtrar bodegas por el piso seleccionado, obteniendo bodegas únicas con sus secciones agrupadas
  const bodegasUnicas = React.useMemo(() => {
    const map = new Map<string, { bodega: string; secciones: string[]; departamentos: string[] }>();
    
    directorio
      .filter((w) => w.piso.toLowerCase() === selectedPiso.toLowerCase())
      .forEach((w) => {
        const key = w.bodega.trim();
        if (!map.has(key)) {
          map.set(key, { bodega: key, secciones: [], departamentos: [] });
        }
        const entry = map.get(key)!;
        if (w.seccion && !entry.secciones.includes(w.seccion)) {
          entry.secciones.push(w.seccion);
        }
        if (w.departamento && !entry.departamentos.includes(w.departamento)) {
          entry.departamentos.push(w.departamento);
        }
      });
      
    return Array.from(map.values()).sort((a, b) => a.bodega.localeCompare(b.bodega));
  }, [directorio, selectedPiso]);

  // Establecer el primer piso por defecto si no hay ninguno seleccionado
  useEffect(() => {
    if (!selectedPiso && pisos.length > 0) {
      setSelectedPiso(pisos[0]);
    }
  }, [pisos, selectedPiso]);

  // Mantener el enfoque automático en el input de escaneo si está activado
  useEffect(() => {
    if (autoFocusEnabled && selectedPiso && selectedBodega && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [autoFocusEnabled, selectedPiso, selectedBodega, lastScanResult]);

  // Si cambia el piso, limpiar bodega seleccionada
  const handlePisoChange = (piso: string) => {
    setSelectedPiso(piso);
    setSelectedBodega('');
    setLastScanResult(null);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    processBarcode(barcode);
    setBarcodeInput('');
  };

  const processBarcode = (barcode: string) => {
    const matchedContainer = manifiesto.find((c) => c.id.toLowerCase() === barcode.toLowerCase());
    const timestamp = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logId = Math.random().toString(36).substr(2, 9);

    if (matchedContainer) {
      // Caso 1: Contenedor ya recibido anteriormente
      if (matchedContainer.estado === 'Recibido') {
        if (soundEnabled) playWarningBeep();
        if (voiceEnabled) speakText(`Contenedor duplicado.`);
        
        setLastScanResult({
          id: matchedContainer.id,
          estado: 'Duplicado',
          mensaje: 'Contenedor ya recibido anteriormente',
          detalle: `Ubicado en ${matchedContainer.pisoRecibido}, Bodega: ${matchedContainer.bodegaRecibida} el ${matchedContainer.fechaRecepcion}`
        });

        onAddScanLog({
          id: logId,
          contenedorId: matchedContainer.id,
          piso: selectedPiso,
          bodega: selectedBodega,
          fecha: timestamp,
          estado: 'Duplicado',
          seccion: matchedContainer.seccion,
          tarima: matchedContainer.tarima,
          cantidad: matchedContainer.cantidad
        });
      } else {
        // Encontrar ubicación asignada en el Directorio basado en la SECCIÓN
        const asignacion = directorio.find(
          (w) => w.seccion.toLowerCase() === matchedContainer.seccion.toLowerCase()
        );

        if (asignacion) {
          const pisoAsignado = asignacion.piso;
          const bodegaAsignada = asignacion.bodega;

          // Verificar si el piso y la bodega coinciden exactamente
          const esCorrecto = 
            pisoAsignado.toLowerCase() === selectedPiso.toLowerCase() &&
            bodegaAsignada.toLowerCase() === selectedBodega.toLowerCase();

          if (esCorrecto) {
            // Caso 2: Recibido en Ubicación Correcta
            if (soundEnabled) playSuccessBeep();
            if (voiceEnabled) speakText(`Ubicación correcta.`);

            setLastScanResult({
              id: matchedContainer.id,
              estado: 'Exitoso',
              mensaje: '¡Ubicación Correcta!',
              detalle: `Contenedor asignado a ${asignacion.departamento}. Jefe: ${asignacion.jefeDepartamento}.`,
              pisoAsignado,
              bodegaAsignada,
              seccion: matchedContainer.seccion
            });

            // Actualizar estado del contenedor en el Manifiesto como Correcto
            onUpdateContainerStatus(matchedContainer.id, 'Recibido', selectedPiso, selectedBodega, 'Correcto');

            onAddScanLog({
              id: logId,
              contenedorId: matchedContainer.id,
              piso: selectedPiso,
              bodega: selectedBodega,
              fecha: timestamp,
              estado: 'Exitoso',
              seccion: matchedContainer.seccion,
              tarima: matchedContainer.tarima,
              cantidad: matchedContainer.cantidad
            });
          } else {
            // Caso 3: Reubicar (La ubicación escaneada es incorrecta para su sección)
            if (soundEnabled) playWarningBeep();
            if (voiceEnabled) speakText(`Reubicar contenedor en ${pisoAsignado} bodega ${bodegaAsignada}`);

            setLastScanResult({
              id: matchedContainer.id,
              estado: 'Reubicar',
              mensaje: '⚠️ ¡UBICACIÓN INCORRECTA (REUBICAR)!',
              detalle: `Este contenedor de la Sección "${matchedContainer.seccion}" (${asignacion.departamento}) debe ubicarse en PISO: ${pisoAsignado} y BODEGA: ${bodegaAsignada}.`,
              pisoAsignado,
              bodegaAsignada,
              seccion: matchedContainer.seccion
            });

            // Actualizar estado en el Manifiesto como Reubicar
            onUpdateContainerStatus(matchedContainer.id, 'Recibido', selectedPiso, selectedBodega, 'Reubicar');

            onAddScanLog({
              id: logId,
              contenedorId: matchedContainer.id,
              piso: selectedPiso,
              bodega: selectedBodega,
              fecha: timestamp,
              estado: 'Reubicar',
              seccion: matchedContainer.seccion,
              tarima: matchedContainer.tarima,
              cantidad: matchedContainer.cantidad
            });
          }
        } else {
          // Si no hay asignación en el Directorio, se guarda como correcto por defecto pero se advierte
          if (soundEnabled) playSuccessBeep();
          if (voiceEnabled) speakText(`Recibido sin sección registrada.`);

          setLastScanResult({
            id: matchedContainer.id,
            estado: 'Exitoso',
            mensaje: 'Recibido (Sección no mapeada en Directorio)',
            detalle: `Sección: ${matchedContainer.seccion}. Tarima: ${matchedContainer.tarima}.`,
            seccion: matchedContainer.seccion
          });

          onUpdateContainerStatus(matchedContainer.id, 'Recibido', selectedPiso, selectedBodega, 'Correcto');

          onAddScanLog({
            id: logId,
            contenedorId: matchedContainer.id,
            piso: selectedPiso,
            bodega: selectedBodega,
            fecha: timestamp,
            estado: 'Exitoso',
            seccion: matchedContainer.seccion,
            tarima: matchedContainer.tarima,
            cantidad: matchedContainer.cantidad
          });
        }
      }
    } else {
      // Caso 4: No Registrado en el Manifiesto (Contenedor Adicional)
      if (soundEnabled) playErrorBeep();
      if (voiceEnabled) speakText(`No registrado. Contenedor adicional.`);

      setLastScanResult({
        id: barcode,
        estado: 'No Registrado',
        mensaje: 'No en Manifiesto (Adicional)',
        detalle: 'Este contenedor no pertenece al Manifiesto actual. Puedes registrarlo como adicional.'
      });

      // No actualiza el manifiesto hasta que pulse "Registrar Extra"
      onAddScanLog({
        id: logId,
        contenedorId: barcode,
        piso: selectedPiso,
        bodega: selectedBodega,
        fecha: timestamp,
        estado: 'No Registrado'
      });
    }
  };

  const handleRegisterUnregistered = () => {
    if (!lastScanResult || lastScanResult.estado !== 'No Registrado') return;

    const newContainerId = lastScanResult.id;
    const defaultSeccion = 'S-EXTRA';
    const defaultTarima = 'TAR-EXTRA';

    const newContainer: Container = {
      id: newContainerId,
      centro: 'RECEPCIÓN MÓVIL',
      manifiestoNum: 'MNF-EXTRA',
      tarima: defaultTarima,
      seccion: defaultSeccion,
      fechaMnf: new Date().toISOString().split('T')[0],
      cantidad: 1,
      estado: 'Recibido',
      pisoRecibido: selectedPiso,
      bodegaRecibida: selectedBodega,
      fechaRecepcion: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      estatusReporte: 'Adicional'
    };

    onAddContainerToManifiesto(newContainer);

    // Buscar el log correspondiente y actualizarlo
    const matchingLog = scanLogs.find(log => log.contenedorId === newContainerId && log.estado === 'No Registrado');
    if (matchingLog) {
      onRemoveScanLog(matchingLog.id);
      onAddScanLog({
        ...matchingLog,
        id: Math.random().toString(36).substr(2, 9),
        estado: 'Exitoso',
        seccion: defaultSeccion,
        tarima: defaultTarima,
        cantidad: 1
      });
    }

    if (soundEnabled) playSuccessBeep();
    setLastScanResult({
      id: newContainerId,
      estado: 'Exitoso',
      mensaje: '¡Contenedor Adicional Registrado!',
      detalle: `Añadido al Manifiesto con estatus de Reporte "Adicional".`
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Columna Izquierda: Ubicación */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-base">Ubicación Actual</h3>
          </div>

          {/* Selector de Piso */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">1. Piso / Nivel</label>
            <div className="grid grid-cols-2 gap-2">
              {pisos.map((pisoName) => (
                <button
                  key={pisoName}
                  onClick={() => handlePisoChange(pisoName)}
                  className={`py-3 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer truncate ${
                    selectedPiso.toLowerCase() === pisoName.toLowerCase()
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-150 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pisoName}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Bodega */}
          {selectedPiso && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">2. Bodega / Pasillo</label>
              
              {bodegasUnicas.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {bodegasUnicas.map((item) => (
                    <button
                      key={item.bodega}
                      onClick={() => {
                        setSelectedBodega(item.bodega);
                        setLastScanResult(null);
                      }}
                      className={`py-3.5 px-4 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        selectedBodega.toLowerCase() === item.bodega.toLowerCase()
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                          : 'border-slate-150 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 block truncate text-sm">{item.bodega}</span>
                        {item.departamentos.length > 0 && (
                          <span className="text-[10px] text-slate-400 block truncate font-medium mt-0.5">
                            {item.departamentos.join(', ')}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No hay bodegas registradas en {selectedPiso}. Carga un Excel de Directorio o restaura los datos demo.
                </div>
              )}
            </div>
          )}

          {selectedPiso && selectedBodega && (
            <div className="bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Ubicación de Escaneo Activa
              </div>
              <p className="text-slate-600">
                Piso <strong className="text-slate-800">{selectedPiso}</strong> • Bodega: <strong className="text-slate-800">{selectedBodega}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha / Central: Escáner de Contenedores */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Card Escáner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
          
          {/* Header del Escáner */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-5">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800 text-base">Escaneo Continuo de Contenedor</h3>
            </div>

            {/* Ajustes Rápidos */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Toggles Sonido */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar Beep' : 'Activar Beep'}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  soundEnabled ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? 'Desactivar Asistente de Voz' : 'Activar Asistente de Voz'}
                className={`text-xs px-2.5 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  voiceEnabled ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                📢 {voiceEnabled ? 'Voz On' : 'Voz Off'}
              </button>

              {/* Toggle Autofocus */}
              <button
                onClick={() => setAutoFocusEnabled(!autoFocusEnabled)}
                title={autoFocusEnabled ? 'Bloquear Enfoque en Input' : 'Liberar Enfoque'}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  autoFocusEnabled ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {autoFocusEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Cuerpo del Escáner */}
          {selectedPiso && selectedBodega ? (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              
              {/* Formulario de Escaneo */}
              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Escanea con el láser Zebra o escribe el ID del contenedor..."
                    className="w-full pl-5 pr-14 py-4 rounded-xl border-2 border-indigo-150 focus:border-indigo-500 focus:outline-none font-mono text-lg text-slate-800 placeholder-slate-300 shadow-xs transition-all text-center tracking-wider"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-center text-slate-400">
                  {autoFocusEnabled 
                    ? "✓ Enfoque Automático Activado para Handhelds Zebra (escanear sin tocar la pantalla)" 
                    : "El cursor no regresará automáticamente tras cada escaneo"}
                </p>
              </form>

              {/* Resultado Visual Gigante */}
              <div className="flex-1 flex items-center justify-center min-h-[160px]">
                {lastScanResult ? (
                  <div className={`w-full p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all ${
                    lastScanResult.estado === 'Exitoso'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : lastScanResult.estado === 'Reubicar'
                      ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
                      : lastScanResult.estado === 'Duplicado'
                      ? 'bg-orange-50 border-orange-150 text-orange-800'
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    {/* Icono */}
                    <div className="shrink-0">
                      {lastScanResult.estado === 'Exitoso' && <CheckCircle2 className="w-12 h-12 text-emerald-500" />}
                      {lastScanResult.estado === 'Reubicar' && <AlertTriangle className="w-12 h-12 text-amber-600 animate-pulse" />}
                      {lastScanResult.estado === 'Duplicado' && <AlertTriangle className="w-12 h-12 text-orange-500" />}
                      {lastScanResult.estado === 'No Registrado' && <XCircle className="w-12 h-12 text-rose-500" />}
                    </div>

                    {/* Textos */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <span className="font-mono font-bold text-lg text-slate-900 tracking-wider bg-white/60 px-2.5 py-0.5 rounded border border-slate-200/50 self-center sm:self-start">
                          {lastScanResult.id}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-block uppercase tracking-wider self-center sm:self-start ${
                          lastScanResult.estado === 'Exitoso' ? 'bg-emerald-100 text-emerald-800' :
                          lastScanResult.estado === 'Reubicar' ? 'bg-amber-200 text-amber-800 border border-amber-300' :
                          lastScanResult.estado === 'Duplicado' ? 'bg-orange-100 text-orange-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {lastScanResult.estado === 'Exitoso' ? 'CORRECTO ✓' :
                           lastScanResult.estado === 'Reubicar' ? 'REUBICAR ⚠️' :
                           lastScanResult.estado === 'Duplicado' ? 'DUPLICADO' :
                           'ADICIONAL'}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800">{lastScanResult.mensaje}</h4>
                      {lastScanResult.detalle && (
                        <p className="text-xs text-slate-600 font-medium">{lastScanResult.detalle}</p>
                      )}

                      {/* Alerta de ubicación correcta para reubicación */}
                      {lastScanResult.estado === 'Reubicar' && (
                        <div className="mt-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 text-xs text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Ubicación correcta según Directorio: <strong className="text-slate-900 font-bold">{lastScanResult.pisoAsignado}</strong> en <strong className="text-slate-900 font-bold">{lastScanResult.bodegaAsignada}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acción especial para No Registrados */}
                    {lastScanResult.estado === 'No Registrado' && (
                      <button
                        onClick={handleRegisterUnregistered}
                        className="sm:ml-auto px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-100/80 hover:bg-rose-200 border border-rose-200 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Registrar Adicional
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                      <Scan className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Listo para Escanear</p>
                      <p className="text-xs text-slate-400">Pasa el lector sobre los códigos o utiliza el simulador rápido</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de simulación para facilidad del usuario en la demo */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Simular Códigos Rápidos (Demo)</p>
                  <span className="text-[9px] text-indigo-500 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Úsalos para probar la validación
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {manifiesto.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBarcodeInput(item.id);
                        if (barcodeInputRef.current) barcodeInputRef.current.focus();
                      }}
                      className="px-2 py-1 text-[10px] font-mono font-bold text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded border border-slate-200 transition-all cursor-pointer"
                    >
                      {item.id} (Secc. {item.seccion})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeInput('CONT-EXTRA-' + Math.floor(Math.random() * 1000));
                      if (barcodeInputRef.current) barcodeInputRef.current.focus();
                    }}
                    className="px-2 py-1 text-[10px] font-mono font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200 rounded border border-rose-100 transition-all cursor-pointer"
                  >
                    + Código Inexistente
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl">
              <Building2 className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">Paso Requerido:</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Por favor, selecciona una <strong className="text-indigo-600 font-semibold">Bodega / Pasillo</strong> a la izquierda en el Piso activo para encender el lector continuo.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Historial de Escaneo del Turno - Ancho Completo abajo */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Historial de Escaneos de la Sesión
              <span className="text-xs bg-slate-150 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                {scanLogs.length}
              </span>
            </h4>
            <p className="text-xs text-slate-400 font-mono">Último arriba</p>
          </div>

          {scanLogs.length > 0 ? (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Contenedor</th>
                    <th className="py-3 px-4">Tarima</th>
                    <th className="py-3 px-4">Ubicación Registrada</th>
                    <th className="py-3 px-4">Sección</th>
                    <th className="py-3 px-4">Resultado Validación</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scanLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono">{log.fecha}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 tracking-wider">{log.contenedorId}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.tarima || 'EXTRA'}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {log.piso} • {log.bodega}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold text-[11px]">
                          Secc. {log.seccion || 'EXTRA'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          log.estado === 'Exitoso'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.estado === 'Reubicar'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : log.estado === 'Duplicado'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.estado === 'Exitoso' ? 'bg-emerald-500' :
                            log.estado === 'Reubicar' ? 'bg-amber-500' :
                            log.estado === 'Duplicado' ? 'bg-orange-500' :
                            'bg-rose-500'
                          }`}></span>
                          {log.estado === 'Exitoso' ? 'Ubicación OK' : log.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onRemoveScanLog(log.id)}
                          title="Eliminar del historial"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer inline-flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aún no hay escaneos registrados. Selecciona un piso/bodega y escanea para empezar la validación.
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
