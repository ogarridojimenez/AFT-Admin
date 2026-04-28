'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type Asset = {
  asset_id: string;
  name: string | null;
  status: string;
  areas: { id: string; code: string; name: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Area = { id: string; name: string; code: string };

export default function AssetsPage() {
  return (
    <Suspense fallback={<AssetsLoading />}>
      <AssetsContent />
    </Suspense>
  );
}

function AssetsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48"><Skeleton className="h-8 w-48" /></div>
      <TableSkeleton rows={10} />
    </div>
  );
}

function AssetsContent() {
  const { addToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('asset_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: '', area_id: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (areaFilter) params.set('areaId', areaFilter);
      if (statusFilter) params.set('status', statusFilter);

      const [assetsRes, areasRes] = await Promise.all([
        fetch(`/api/assets?${params}`, { credentials: 'include' }),
        fetch('/api/areas', { credentials: 'include' }),
      ]);

      const assetsData = await assetsRes.json();
      const areasData = await areasRes.json();

      if (assetsData.assets) setAssets(assetsData.assets);
      if (assetsData.pagination) setPagination(assetsData.pagination);
      if (areasData.areas) setAreas(areasData.areas);
    } catch (e) {
      console.error('Error fetching:', e);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, areaFilter, statusFilter, sortBy, sortOrder, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="ml-1">{sortBy === column ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
  );

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      name: asset.name ?? '',
      status: asset.status,
      area_id: asset.areas?.id ?? '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    setSaving(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          asset_id: editingAsset.asset_id,
          name: editForm.name || null,
          status: editForm.status,
          area_id: editForm.area_id || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Activo actualizado', 'success');
        setEditingAsset(null);
        fetchData();
      }
    } catch (e) {
      addToast('Error al actualizar activo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm(`¿Eliminar activo ${assetId}?`)) return;
    setDeletingId(assetId);
    try {
      const res = await fetch(`/api/assets?assetId=${assetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.error) {
        addToast(data.error, 'error');
      } else {
        addToast('Activo eliminado', 'success');
        fetchData();
      }
    } catch (e) {
      addToast('Error al eliminar activo', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Activos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Total: {pagination.total} activos • Página {pagination.page} de {pagination.totalPages}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg bg-white p-3 shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Buscar por ID o nombre..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={areaFilter}
          onChange={(e) => { setAreaFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="retired">Retirado</option>
        </select>
        <button
          onClick={() => fetchData()}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={10} />
      ) : assets.length === 0 ? (
        <EmptyState
          title="No se encontraron activos"
          description="Intenta con otros filtros de búsqueda"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100" onClick={() => handleSort('asset_id')}>
                    asset_id <SortIcon column="asset_id" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                    Nombre <SortIcon column="name" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100" onClick={() => handleSort('area')}>
                    Área <SortIcon column="area" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                    Estado <SortIcon column="status" />
                  </th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const area = a.areas as { id: string; code: string; name: string } | null;
                  return (
                    <tr key={a.asset_id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{a.asset_id}</td>
                      <td className="px-4 py-3 text-slate-800">{a.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {area ? `${area.name} (${area.code})` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === 'active' ? 'bg-green-100 text-green-700' :
                          a.status === 'inactive' ? 'bg-slate-100 text-slate-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(a)}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(a.asset_id)}
                            disabled={deletingId === a.asset_id}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === a.asset_id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-slate-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Editar Activo</h3>
            <p className="mb-4 text-sm text-slate-500">{editingAsset.asset_id}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="retired">Retirado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Área</label>
                <select
                  value={editForm.area_id}
                  onChange={(e) => setEditForm(f => ({ ...f, area_id: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Sin área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingAsset(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
