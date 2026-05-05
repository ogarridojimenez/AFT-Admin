'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type Inventory = {
  id: string;
  inventory_date: string;
  status: string;
  notes: string | null;
  areas: { id?: string; name: string; code: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function InventoriesPage() {
  return (
    <Suspense fallback={<InventoriesLoading />}>
      <InventoriesContent />
    </Suspense>
  );
}

function InventoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48"><div className="animate-pulse h-8 w-48 bg-slate-200 rounded" /></div>
      <TableSkeleton rows={5} />
    </div>
  );
}

function InventoriesContent() {
  const { addToast } = useToast();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('inventory_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyArea, setHistoryArea] = useState<{ name: string; code: string } | null>(null);
  const [historyData, setHistoryData] = useState<Inventory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      if (statusFilter) params.set('status', statusFilter);

      const [invRes, areasRes] = await Promise.all([
        fetch(`/api/inventories?${params}`, { credentials: 'include' }),
        fetch('/api/areas', { credentials: 'include' }),
      ]);

      const invData = await invRes.json();
      const areasData = await areasRes.json();

      if (invData.inventories) setInventories(invData.inventories);
      if (invData.pagination) setPagination(invData.pagination);
      if (areasData.areas) setAreas(areasData.areas);
    } catch (e) {
      console.error('Error fetching:', e);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter, sortBy, sortOrder, pagination.limit]);

  const fetchHistory = async (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    
    setHistoryArea(area);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/inventories?action=history&areaId=${areaId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.inventories) setHistoryData(data.inventories);
    } catch (e) {
      addToast('Error al cargar historial', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (inventoryId: string) => {
    const confirmed = window.confirm('¿Estás seguro de eliminar este inventario? Se eliminarán todos los datos relacionados.');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/inventories/${inventoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      
      if (data.success) {
        addToast('Inventario eliminado', 'success');
        fetchData();
      } else {
        addToast(data.error || 'Error al eliminar', 'error');
      }
    } catch (e) {
      addToast('Error al eliminar inventario', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'inventory_date' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="ml-1">{sortBy === column ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Inventarios</h2>
        <Link
          href="/inventories/new"
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          Nuevo inventario
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg bg-white p-3 shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Buscar por ID o notas..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="planned">Planificado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <button
          onClick={() => fetchData()}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : inventories.length === 0 ? (
        <EmptyState
          title="No hay inventarios"
          description="Crea uno para usar en la app móvil"
          action={{ label: 'Nuevo inventario', onClick: () => window.location.href = '/inventories/new' }}
        />
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Total: {pagination.total} inventarios • Página {pagination.page} de {pagination.totalPages}
          </p>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100" onClick={() => handleSort('inventory_date')}>
                    Fecha <SortIcon column="inventory_date" />
                  </th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                    Estado <SortIcon column="status" />
                  </th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Historial</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventories.map((inv) => {
                  const area = inv.areas as { name: string; code: string } | null;
                  return (
                    <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800">
                        <Link href={`/inventories/${inv.id}`} className="text-brand-600 hover:underline">
                          {inv.inventory_date}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {area ? `${area.name} (${area.code})` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.id}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => fetchHistory(inv.areas?.id || '')}
                          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Ver historial
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
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

      {/* History Modal */}
      {historyArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Historial de Inventarios</h3>
              <p className="text-sm text-slate-500">{historyArea.name} ({historyArea.code})</p>
            </div>
            <div className="overflow-y-auto p-6">
              {historyLoading ? (
                <p className="text-sm text-slate-500">Cargando historial...</p>
              ) : historyData.length === 0 ? (
                <p className="text-sm text-slate-500">No hay inventarios para esta área</p>
              ) : (
                <div className="space-y-2">
                  {historyData.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div>
                        <p className="font-medium text-slate-900">{inv.inventory_date}</p>
                        <p className="text-xs text-slate-500">{inv.id}</p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => { setHistoryArea(null); setHistoryData([]); }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}