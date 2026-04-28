import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/auth/guard';

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    const areaId = searchParams.get('areaId') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'asset_id';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const supabase = createSupabaseAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('assets')
      .select('asset_id, name, status, areas(id, code, name)', { count: 'exact' });

    if (search) {
      query = query.or(`asset_id.ilike.%${search}%,name.ilike.%${search}%`);
    }
    if (areaId) {
      query = query.eq('area_id', areaId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const sortColumn = sortBy === 'area' ? 'areas.name' : sortBy;
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      assets: data ?? [],
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

export async function PUT(request: Request) {
  try {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { asset_id, name, status, area_id } = body;

    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id requerido' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (area_id !== undefined) updateData.area_id = area_id;

    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('asset_id', asset_id)
      .select('asset_id, name, status, areas(id, code, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json({ error: 'assetId requerido' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('asset_id', assetId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
