import { useState } from 'react';
import { Container, Warehouse } from '../types';
import { Search, Database, CheckCircle, Clock, Building, User, Tag, Calendar, MapPin, Briefcase } from 'lucide-react';

interface DataExplorerProps {
  manifiesto: Container[];
  directorio: Warehouse[];
}

export default function DataExplorer({ manifiesto, directorio }: DataExplorerProps) {
  const [activeTab, setActiveTab] = useState<'manifiesto' | 'directorio'>('manifiesto');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendiente' | 'Recibido'>('Todos');

  // Filtrado Inteligente de Manifiesto
  const manifiestoFiltrado = manifiesto.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      c.id.toLowerCase().includes(q) ||
      c.centro.toLowerCase().includes(q) ||
      c.manifiestoNum.toLowerCase().includes(q) ||
      c.tarima.toLowerCase().includes(q) ||
      c.seccion.toLowerCase().includes(q) ||
      c.fechaMnf.toLowerCase().includes(q);
    
    const matchesStatus = statusFilter === 'Todos' || c.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtrado Inteligente de Directorio
  const directorioFiltrado = directorio.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      w.seccion.toLowerCase().includes(q) ||
      w.departamento.toLowerCase().includes(q) ||
      w.jefeDepartamento.toLowerCase().includes(q) ||
      w.nombreCorto.toLowerCase().includes(q) ||
      w.piso.toLowerCase().includes(q) ||
      w.bodega.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      
      {/* Selector de Pestaña Principal */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => {
            setActiveTab('manifiesto');
            setSearchQuery('');
          }}
          className={`flex-1 py-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex justify-center items-center gap-2 ${
            activeTab === 'manifiesto'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-750 hover:bg-slate-50/50'
          }`}
        >
          <Database className="w-4 h-4" />
          Manifiesto de Carga ({manifiesto.length})
        </button>
        
        <button
          onClick={() => {
            setActiveTab('directorio');
            setSearchQuery('');
          }}
          className={`flex-1 py-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex justify-center items-center gap-2 ${
            activeTab === 'directorio'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-750 hover:bg-slate-50/50'
          }`}
        >
          <Building className="w-4 h-4" />
          Directorio de Bodegas ({directorio.length})
        </button>
      </div>

      {/* Contenedor de Filtros y Búsqueda */}
      <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'manifiesto' 
                ? "Buscar por ID, manifiesto, tarima, sección..." 
                : "Buscar por sección, depto, jefe, piso, bodega..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Filtros de Estado (Solo Manifiesto) */}
        {activeTab === 'manifiesto' && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto">
            {(['Todos', 'Pendiente', 'Recibido'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {status === 'Todos' ? 'Todos' : status === 'Pendiente' ? '🔴 Pendientes' : '🟢 Recibidos'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabla de Manifiesto */}
      {activeTab === 'manifiesto' && (
        <div>
          {manifiestoFiltrado.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Centro / MNF</th>
                    <th className="py-3.5 px-5">Tarima</th>
                    <th className="py-3.5 px-5">Contenedor ID</th>
                    <th className="py-3.5 px-5">Sección</th>
                    <th className="py-3.5 px-5">Fecha Emisión</th>
                    <th className="py-3.5 px-5 text-right">Cantidad</th>
                    <th className="py-3.5 px-5">Estado</th>
                    <th className="py-3.5 px-5">Ubicación Recepción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {manifiestoFiltrado.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <p className="text-slate-800 font-bold">{c.centro}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-semibold">{c.manifiestoNum}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-600 font-bold">{c.tarima}</td>
                      <td className="py-4 px-5 font-mono font-extrabold text-indigo-700 tracking-wider">
                        {c.id}
                      </td>
                      <td className="py-4 px-5">
                        <span className="bg-indigo-50/50 border border-indigo-100/30 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase">
                          Sect. {c.seccion}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-mono">{c.fechaMnf}</td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-800 text-sm">{c.cantidad}</td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                          c.estado === 'Recibido'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {c.estado === 'Recibido' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
                          {c.estado === 'Recibido' ? 'Recibido' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {c.estado === 'Recibido' && c.pisoRecibido ? (
                          <div className="space-y-0.5">
                            <p className="text-slate-800 font-bold flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                              {c.pisoRecibido}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">{c.bodegaRecibida}</p>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm">
              No se encontraron contenedores en el Manifiesto con los filtros aplicados.
            </div>
          )}
        </div>
      )}

      {/* Tabla de Directorio */}
      {activeTab === 'directorio' && (
        <div>
          {directorioFiltrado.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Sección</th>
                    <th className="py-3.5 px-5">Departamento</th>
                    <th className="py-3.5 px-5">Jefe de Departamento</th>
                    <th className="py-3.5 px-5">Nombre Corto</th>
                    <th className="py-3.5 px-5">Piso / Nivel</th>
                    <th className="py-3.5 px-5">Bodega Autorizada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {directorioFiltrado.map((w, idx) => (
                    <tr key={`${w.seccion}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wider font-mono">
                          {w.seccion}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800">{w.departamento}</td>
                      <td className="py-4 px-5 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {w.jefeDepartamento}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] font-bold">
                          {w.nombreCorto}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {w.piso}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-indigo-700">{w.bodega}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm">
              No se encontraron bodegas en el Directorio con los filtros aplicados.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
