import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { Suspense } from 'react';
import Link from 'next/link';
import { StatsSkeleton } from '@/components/ui/Skeleton';
import { DashboardCharts } from '@/components/ui/Charts';

export const dynamic = 'force-dynamic';

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-600',
    accent: 'bg-accent-100 text-accent-600',
    energy: 'bg-energy-100 text-energy-600',
  };
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-soft transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

async function DashboardStats() {
  const supabase = createSupabaseAdmin();
  
  const [assetsResult, inventoriesResult, areasResult, recentInventories, allInventories] = await Promise.all([
    supabase.from('assets').select('id', { count: 'exact', head: true }),
    supabase.from('inventories').select('id', { count: 'exact', head: true }),
    supabase.from('areas').select('id', { count: 'exact', head: true }),
    supabase
      .from('inventories')
      .select('id, inventory_date, status, areas(name)')
      .order('inventory_date', { ascending: false })
      .limit(5),
    supabase
      .from('inventories')
      .select('inventory_date, status')
      .order('inventory_date', { ascending: false })
      .limit(100),
  ]);

  const counts = {
    assets: assetsResult.count ?? 0,
    inventories: inventoriesResult.count ?? 0,
    areas: areasResult.count ?? 0,
  };

  const recentList = recentInventories.data ?? [];
  const allInv = allInventories.data ?? [];

  const inventoriesByStatus = {
    planned: allInv.filter(i => i.status === 'planned').length,
    completed: allInv.filter(i => i.status === 'completed').length,
    cancelled: allInv.filter(i => i.status === 'cancelled').length,
  };

  const monthCounts = new Map<string, number>();
  allInv.forEach(inv => {
    const month = inv.inventory_date?.substring(0, 7) || 'Sin fecha';
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  });
  const inventoriesByMonth = Array.from(monthCounts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .reverse()
    .map(([label, value]) => ({ label: label.substring(5), value }));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard 
          title="Áreas" 
          value={counts.areas} 
          color="brand"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard 
          title="Activos" 
          value={counts.assets} 
          color="accent"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        />
        <StatCard 
          title="Inventarios" 
          value={counts.inventories} 
          color="energy"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
      </div>

      <DashboardCharts 
        inventoriesByStatus={inventoriesByStatus} 
        inventoriesByMonth={inventoriesByMonth}
      />

      {recentList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Inventarios recientes</h3>
            </div>
            <Link href="/inventories" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {recentList.map((inv) => {
              const area = inv.areas as unknown as { name: string } | null;
              const statusColors: Record<string, string> = {
                completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                planned: 'bg-brand-100 text-brand-700 border-brand-200',
                cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
              };
              return (
                <Link 
                  key={inv.id} 
                  href={`/inventories/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700">
                        {inv.inventory_date}
                      </p>
                      <p className="text-xs text-slate-500">{area?.name ?? 'Sin área'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                    {inv.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-8 text-white">
        <p className="text-brand-100 text-sm font-medium uppercase tracking-wide">Dashboard</p>
        <h2 className="mt-2 text-3xl font-bold">Panel de Control AFT</h2>
        <p className="mt-3 text-brand-100 max-w-xl">
          Gestiona tus activos, crea inventarios y sincroniza con la app móvil. 
          Todo en un solo lugar.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/upload"
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group"
        >
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Subir Excel</h3>
            <p className="text-brand-100 text-sm">Carga masiva de activos por área</p>
          </div>
          <svg className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        
        <Link
          href="/inventories/new"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-soft hover:border-brand-300 transition-all group"
        >
          <div className="p-3 bg-accent-100 rounded-xl">
            <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-800">Nuevo Inventario</h3>
            <p className="text-slate-500 text-sm">Crea un nuevo inventario para escanear</p>
          </div>
          <svg className="w-5 h-5 ml-auto text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}