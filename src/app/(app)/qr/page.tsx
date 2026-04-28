'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

type Area = { id: string; name: string; code: string };

export default function QRPage() {
  const { addToast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    fetch('/api/areas', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const list = (j.areas ?? []) as Area[];
        setAreas(list);
        if (list[0]) setAreaId(list[0].id);
      })
      .catch(() => addToast('No se pudieron cargar las áreas', 'error'));
  }, []);

  const selectedArea = areas.find((a) => a.id === areaId);

  async function onGenerate() {
    if (!areaId) return;
    setLoading(true);
    setGenerated(false);

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ areaId }),
      });

      if (!res.ok) {
        const json = await res.json();
        addToast(json.error ?? 'Error al generar PDF', 'error');
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_${selectedArea?.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setGenerated(true);
      addToast('PDF generado correctamente', 'success');
    } catch {
      addToast('Error de red', 'error');
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-energy-100">
            <svg className="w-6 h-6 text-energy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Generar códigos QR</h2>
            <p className="text-sm text-slate-500">Crea códigos QR para tus activos por área</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <label className="block text-sm font-medium text-slate-700 mb-3">Seleccionar área</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <select
            value={areaId}
            onChange={(e) => { setAreaId(e.target.value); setGenerated(false); }}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
            required
          >
            <option value="">Elige un área...</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        </div>

        {selectedArea && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{selectedArea.name}</p>
              <p className="text-xs text-slate-500">Código: {selectedArea.code}</p>
            </div>
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={loading || !areaId}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-energy-600 to-energy-500 hover:from-energy-500 hover:to-energy-400 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Generar QR en PDF</span>
            </>
          )}
        </button>

        {generated && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-3 animate-fade-in">
            <div className="p-2 bg-emerald-100 rounded-full">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-800">PDF generado. Revisa tus descargas.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-brand-100 rounded-lg">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Formato</h3>
          </div>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• 3 columnas × 5 filas por página</li>
            <li>• 15 códigos QR por hoja</li>
            <li>• Listo para imprimir</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-accent-100 rounded-lg">
              <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Contenido</h3>
          </div>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• ID del activo (ej: MB00001)</li>
            <li>• Nombre del activo</li>
            <li>• Ubicación</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          Imprime los códigos, recorta y pega en cada activo antes del inventario
        </p>
      </div>
    </div>
  );
}