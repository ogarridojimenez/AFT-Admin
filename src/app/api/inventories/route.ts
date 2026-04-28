import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth/guard';
import { z } from 'zod';

const postSchema = z.object({
  area_id: z.string().uuid(),
  inventory_date: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'inventory_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = createSupabaseAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('inventories')
      .select('id, inventory_date, status, notes, areas(name, code)', { count: 'exact' });

    if (search) {
      query = query.or(`id.ilike.%${search}%,notes.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      inventories: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireAuth(request);
    if (authError) return authError;

    const json = await request.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('inventories')
      .insert({
        area_id: parsed.data.area_id,
        inventory_date: parsed.data.inventory_date,
        status: 'planned',
        notes: parsed.data.notes ?? null,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      const areaId = searchParams.get('areaId');
      if (!areaId) {
        return NextResponse.json({ error: 'areaId requerido' }, { status: 400 });
      }

      const supabase = createSupabaseAdmin();
      const { data, error } = await supabase
        .from('inventories')
        .select('id, inventory_date, status, notes, areas(name, code)')
        .eq('area_id', areaId)
        .order('inventory_date', { ascending: false })
        .limit(50);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ inventories: data ?? [] });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
