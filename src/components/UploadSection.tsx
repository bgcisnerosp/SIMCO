import React, { useRef, useState } from 'react';
import { Upload, Download, RefreshCw, FileSpreadsheet, Database, Check, AlertCircle } from 'lucide-react';
import { parseExcelFile, mapExcelToManifiesto, mapExcelToDirectorio, downloadManifiestoTemplate, downloadDirectorioTemplate } from '../utils/excel';
import { Container, Warehouse } from '../types';

interface UploadSectionProps {
  onUpdateManifiesto: (data: Container[]) => void;
  onUpdateDirectorio: (data: Warehouse[]) => void;
  onResetPresets: () => void;
  manifiestoCount: number;
  directorioCount: number;
}

export default function UploadSection({
  onUpdateManifiesto,
  onUpdateDirectorio,
  onResetPresets,
  manifiestoCount,
  directorioCount,
}: UploadSectionProps) {
  const fileInputManifiesto = useRef<HTMLInputElement>(null);
  const fileInputDirectorio = useRef<HTMLInputElement>(null);

  const [manifiestoFile, setManifiestoFile] = useState<string | null>(null);
  const [directorioFile, setDirectorioFile] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleManifiestoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading((prev) => ({ ...prev, manifiesto: true }));
    setError(null);
    try {
      const rows = await parseExcelFile(file);
      const mapped = mapExcelToManifiesto(rows);
      if (mapped.length === 0) {
        throw new Error('No se encontraron registros válidos de CONTENEDOR en el archivo. Verifica las columnas de tu Manifiesto.');
      }
      onUpdateManifiesto(mapped);
      setManifiestoFile(file.name);
      triggerSuccessMsg(`¡Manifiesto cargado con éxito! Se importaron ${mapped.length} contenedores.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading((prev) => ({ ...prev, manifiesto: false }));
      if (fileInputManifiesto.current) fileInputManifiesto.current.value = '';
    }
  };

  const handleDirectorioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading((prev) => ({ ...prev, directorio: true }));
    setError(null);
    try {
      const rows = await parseExcelFile(file);
      const mapped = mapExcelToDirectorio(rows);
      if (mapped.length === 0) {
        throw new Error('No se encontraron registros válidos de SECCIÓN o BODEGA en el archivo. Verifica las columnas de tu Directorio.');
      }
      onUpdateDirectorio(mapped);
      setDirectorioFile(file.name);
      triggerSuccessMsg(`¡Directorio de almacén cargado con éxito! Se registraron ${mapped.length} secciones.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading((prev) => ({ ...prev, directorio: false }));
      if (fileInputDirectorio.current) fileInputDirectorio.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Cargar Bases (Excel)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sube los archivos de Excel para configurar los contenedores esperados y las reglas de ubicación física del almacén.
          </p>
        </div>
        
        <button
          onClick={onResetPresets}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
          Cargar Datos Demo de Liverpool
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Error en la estructura:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
          <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">¡Carga Correcta!</span> {successMsg}
          </div>
        </div>
      )}

      {/* Uploader Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Manifiesto Card */}
        <div className="border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 bg-slate-50/50 hover:bg-white transition-all group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center justify-center p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold bg-indigo-100/70 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200/40">
                {manifiestoCount} contenedores en lista
              </span>
            </div>
            
            <h3 className="text-sm font-bold text-slate-800">1. Base del MANIFIESTO</h3>
            <p className="text-xs text-slate-400">
              Registra los contenedores que van a ingresar al almacén, sus cantidades y las secciones correspondientes.
            </p>

            <div className="bg-white border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 font-mono space-y-1">
              <span className="font-bold text-slate-700 block text-[11px] mb-1.5 text-indigo-600 border-b border-indigo-50/50 pb-1">Columnas Obligatorias (A-G):</span>
              <div className="grid grid-cols-2 gap-1 font-semibold text-slate-600">
                <span>A: CENTRO</span>
                <span>B: MANIFIESTO</span>
                <span>C: TARIMA</span>
                <span>D: CONTENEDOR</span>
                <span>E: SECCIÓN</span>
                <span>F: FECHA MNF</span>
                <span>G: CANTIDAD</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputManifiesto.current?.click()}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer gap-1.5"
                disabled={loading.manifiesto}
              >
                <Upload className="w-4 h-4" />
                {loading.manifiesto ? 'Procesando...' : 'Subir Manifiesto (.xlsx)'}
              </button>
              
              <button
                onClick={downloadManifiestoTemplate}
                title="Descargar Plantilla con la disposición A-G"
                className="inline-flex items-center justify-center p-2.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-750 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputManifiesto}
              onChange={handleManifiestoUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {manifiestoFile && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 truncate font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                Archivo cargado: {manifiestoFile}
              </p>
            )}
          </div>
        </div>

        {/* Directorio Card */}
        <div className="border border-slate-100 hover:border-emerald-100 rounded-2xl p-5 bg-slate-50/50 hover:bg-white transition-all group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center justify-center p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Database className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold bg-emerald-100/70 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/40">
                {directorioCount} secciones de almacén
              </span>
            </div>
            
            <h3 className="text-sm font-bold text-slate-800">2. Base del DIRECTORIO</h3>
            <p className="text-xs text-slate-400">
              Registra la correspondencia de dónde debe almacenarse cada Sección en los niveles físicos (Pisos y Bodegas).
            </p>

            <div className="bg-white border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 font-mono space-y-1">
              <span className="font-bold text-slate-700 block text-[11px] mb-1.5 text-emerald-600 border-b border-emerald-50/50 pb-1">Columnas Obligatorias (A-F):</span>
              <div className="grid grid-cols-2 gap-1 font-semibold text-slate-600">
                <span>A: SECCIÓN</span>
                <span>B: DEPARTAMENTO</span>
                <span>C: JEFE DE DEPARTAMENTO</span>
                <span>D: NOMBRE CORTO</span>
                <span>E: PISO</span>
                <span>F: BODEGA</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputDirectorio.current?.click()}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer gap-1.5"
                disabled={loading.directorio}
              >
                <Upload className="w-4 h-4" />
                {loading.directorio ? 'Procesando...' : 'Subir Directorio (.xlsx)'}
              </button>
              
              <button
                onClick={downloadDirectorioTemplate}
                title="Descargar Plantilla con la disposición A-F"
                className="inline-flex items-center justify-center p-2.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-750 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputDirectorio}
              onChange={handleDirectorioUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {directorioFile && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 truncate font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                Archivo cargado: {directorioFile}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
