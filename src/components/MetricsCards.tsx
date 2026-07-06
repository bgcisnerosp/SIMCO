import { Container } from '../types';
import { Package, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface MetricsCardsProps {
  manifiesto: Container[];
  scanCount: number;
  unregisteredCount: number;
}

export default function MetricsCards({ manifiesto, scanCount, unregisteredCount }: MetricsCardsProps) {
  const total = manifiesto.length;
  const recibidos = manifiesto.filter((c) => c.estado === 'Recibido').length;
  const pendientes = total - recibidos;
  
  const porcentaje = total > 0 ? Math.round((recibidos / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Manifiesto */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Manifiesto</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{total}</p>
          </div>
        </div>

        {/* Recibidos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recibidos</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-800">{recibidos}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {porcentaje}%
              </span>
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{pendientes}</p>
          </div>
        </div>

        {/* Sin Registro / No Manifiesto */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">No Registrados</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{unregisteredCount}</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-slate-700">Progreso General de Recepción</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{recibidos} de {total} contenedores ({porcentaje}%)</span>
        </div>
        
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </div>
  );
}
