import { createSupabaseAdmin } from '../supabase/admin';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export async function getCachedCounts() {
  const supabase = createSupabaseAdmin();
  
  return fetchWithCache('dashboard:counts', async () => {
    const [assets, inventories, areas] = await Promise.all([
      supabase.from('assets').select('id', { count: 'exact', head: true }),
      supabase.from('inventories').select('id', { count: 'exact', head: true }),
      supabase.from('areas').select('id', { count: 'exact', head: true }),
    ]);

    return {
      assets: assets.count ?? 0,
      inventories: inventories.count ?? 0,
      areas: areas.count ?? 0,
    };
  });
}

export async function getCachedAssets(page = 1, limit = 50, filters?: {
  search?: string;
  areaId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const supabase = createSupabaseAdmin();
  const offset = (page - 1) * limit;
  
  return fetchWithCache(`assets:${page}:${limit}:${JSON.stringify(filters)}`, async () => {
    let query = supabase
      .from('assets')
      .select('asset_id, name, status, areas(code, name)', { count: 'exact' });

    if (filters?.search) {
      query = query.or(`asset_id.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }
    if (filters?.areaId) {
      query = query.eq('area_id', filters.areaId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const sortColumn = filters?.sortBy === 'area' ? 'areas.name' : filters?.sortBy || 'asset_id';
    query = query.order(sortColumn, { ascending: filters?.sortOrder !== 'desc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      assets: data ?? [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  });
}

export async function getCachedInventories(page = 1, limit = 20, filters?: {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const supabase = createSupabaseAdmin();
  const offset = (page - 1) * limit;
  
  return fetchWithCache(`inventories:${page}:${limit}:${JSON.stringify(filters)}`, async () => {
    let query = supabase
      .from('inventories')
      .select('id, inventory_date, status, notes, areas(name, code)', { count: 'exact' });

    if (filters?.search) {
      query = query.or(`id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order(filters?.sortBy || 'inventory_date', { ascending: filters?.sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      inventories: data ?? [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  });
}