'use client';

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

type Area = { id: string; name: string; code: string };

export default function UploadPage() {
  const { addToast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [details, setDetails] = useState<unknown>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('file') as HTMLInputElement;
    const f = input.files?.[0];
    
    if (!f || !selectedArea) {
      addToast('Selecciona archivo y área', 'error');
      return;
    }

    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      addToast('Solo se aceptan archivos Excel (.xlsx, .xls)', 'error');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setDetails(null);

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 200);

    try {
      const body = new FormData();
      body.set('file', f);
      body.set('areaCode', selectedArea.code);
      const res = await fetch('/api/upload', { method: 'POST', body, credentials: 'include' });
      const json = await res.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        setStatus('error');
        addToast(json.error ?? 'Error al procesar', 'error');
        setDetails(json.details ?? null);
        return;
      }
      
      setStatus('done');
      addToast(`Procesados: ${json.processed} activos`, 'success');
      setDetails(json.errors ?? []);
    } catch {
      clearInterval(progressInterval);
      setStatus('error');
      addToast('Fallo de red o servidor', 'error');
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-100">
            <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Carga masiva de activos</h2>
            <p className="text-sm text-slate-500">Sube un Excel por área para registrar múltiples activos</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
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
              onChange={(e) => setAreaId(e.target.value)}
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
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ${
            dragActive 
              ? 'border-brand-500 bg-brand-50' 
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setStatus('idle');
                setDetails(null);
              }
            }}
          />
          
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              dragActive ? 'bg-brand-100' : 'bg-slate-100'
            }`}>
              <svg className={`w-8 h-8 ${dragActive ? 'text-brand-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <label 
              htmlFor="file" 
              className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <span>Haz clic para seleccionar</span>
              <span className="text-slate-400">o arrastra el archivo</span>
            </label>
            
            <p className="mt-2 text-xs text-slate-400">Formatos aceptados: .xlsx, .xls</p>
          </div>

          {/* Selected file preview */}
          <div id="file-preview" className="hidden mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p id="file-name" className="text-sm font-medium text-slate-900 truncate"></p>
              <p id="file-size" className="text-xs text-slate-500"></p>
            </div>
            <button 
              type="button" 
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                document.getElementById('file-preview')?.classList.add('hidden');
              }}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {status === 'uploading' && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Procesando archivo...</span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'uploading' || !areaId}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {status === 'uploading' ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Subir y validar Excel</span>
            </>
          )}
        </button>
      </form>

      {status === 'done' && selectedArea && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-full">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">Carga completada</h3>
              <p className="text-sm text-emerald-700">Área: {selectedArea.name}</p>
            </div>
          </div>
          
          {Array.isArray(details) && details.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-800">Errores de validación ({details.length})</p>
              <ul className="mt-2 text-xs text-amber-700 space-y-1 max-h-40 overflow-y-auto">
                {(details as { row: number; message: string }[]).slice(0, 10).map((d, i) => (
                  <li key={i}>• Fila {d.row}: {d.message}</li>
                ))}
                {details.length > 10 && (
                  <li className="text-amber-600 italic">...y {details.length - 10} más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Formato esperado del Excel</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            <span>asset_id (MB00001)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            <span>name</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            <span>category</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            <span>location</span>
          </div>
        </div>
      </div>
    </div>
  );
}