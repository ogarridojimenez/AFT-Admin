'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type Area = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

export default function AreasPage() {
  return (
    <AreasContent />
  );
}

function AreasContent() {
  const { addToast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadArea, setUploadArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/areas?includeInactive=true', { credentials: 'include' });
      const data = await res.json();
      if (data.areas) setAreas(data.areas);
    } catch (e) {
      console.error('Error fetching areas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const openCreateModal = () => {
    setEditingArea(null);
    setForm({ name: '', code: '' });
    setShowModal(true);
  };

  const openEditModal = (area: Area) => {
    setEditingArea(area);
    setForm({ name: area.name, code: area.code });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      addToast('Nombre y código requeridos', 'error');
      return;
    }
    setSaving(true);
    try {
      const method = editingArea ? 'PUT' : 'POST';
      const body = editingArea 
        ? { id: editingArea.id, name: form.name, code: form.code }
        : { name: form.name, code: form.code };
      
      const res = await fetch('/api/areas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast(editingArea ? 'Área actualizada' : 'Área creada', 'success');
        setShowModal(false);
        fetchAreas();
      }
    } catch (e) {
      addToast('Error al guardar área', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    if (!confirm(`¿Eliminar área "${area?.name}"? Esta acción no se puede deshacer.`)) return;
    
    setDeletingId(areaId);
    try {
      const res = await fetch(`/api/areas?areaId=${areaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Área eliminada', 'success');
        fetchAreas();
      }
    } catch (e) {
      addToast('Error al desactivar área', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const openUploadModal = (area: Area) => {
    setUploadArea(area);
    setShowUploadModal(true);
  };

  const handleUploadAssets = async (file: File, replace: boolean) => {
    if (!uploadArea) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('areaCode', uploadArea.code);
      formData.append('replace', String(replace));

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast(`Se procesaron ${data.processed} activos`, 'success');
        setShowUploadModal(false);
      }
    } catch (e) {
      addToast('Error al subir activos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleForceDelete = async (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    const confirmed = window.confirm(
      `¿ELIMINAR DEFINITIVAMENTE el área "${area?.name}" y TODOS sus activos? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(areaId);
    try {
      const res = await fetch(`/api/areas?areaId=${areaId}&force=true`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Área y activos eliminados', 'success');
        fetchAreas();
      }
    } catch (e) {
      addToast('Error al eliminar área', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32"><Skeleton className="h-8 w-32" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-slate-200 p-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Áreas</h2>
          <p className="mt-1 text-sm text-slate-600">
            {areas.length} áreas totales
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nueva Área
        </button>
      </div>

      {areas.length === 0 ? (
        <EmptyState
          title="No hay áreas"
          description="Crea tu primera área para comenzar"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <div
              key={area.id}
              className={`rounded-xl border p-4 shadow-sm transition ${
                area.is_active 
                  ? 'border-slate-200 bg-white' 
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{area.name}</h3>
                  <p className="text-sm text-slate-500">{area.code}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  area.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {area.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openEditModal(area)}
                  className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => openUploadModal(area)}
                  className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                >
                  Actualizar activos
                </button>
                <button
                  onClick={() => handleDelete(area.id)}
                  disabled={deletingId === area.id}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === area.id ? '...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => handleForceDelete(area.id)}
                  disabled={deletingId === area.id}
                  className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                  title="Eliminar área y todos sus activos"
                >
                  {deletingId === area.id ? '...' : 'Eliminar todo'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingArea ? 'Editar Área' : 'Nueva Área'}
            </h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ej: Área de Cocina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Código</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ej: COC"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.code}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
</div>
        )}

      {/* Upload Modal */}
      {showUploadModal && uploadArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Actualizar activos - {uploadArea.name} ({uploadArea.code})
            </h3>
            
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-medium">Importante:</p>
                <p>Sube un archivo Excel con los activos. Selecciona si deseas:</p>
                <ul className="mt-2 list-disc pl-4">
                  <li><strong>Agregar:</strong> Mantiene los actuales y agrega los nuevos</li>
                  <li><strong>Reemplazar:</strong> Elimina todos los actuales y agrega los nuevos</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Archivo Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  id="assetFile"
                  className="mt-1 block w-full text-sm text-slate-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadAssets(file, false);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">O reemplazar todos los activos</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  id="assetFileReplace"
                  className="mt-1 block w-full text-sm text-slate-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (confirm('¿Estás seguro? Se eliminarán todos los activos actuales del área.')) {
                        handleUploadAssets(file, true);
                      }
                    }
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Al seleccionar este campo se eliminarán todos los activos actuales y se agregarán los del Excel
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
