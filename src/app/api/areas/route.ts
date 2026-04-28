import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/auth/guard';

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const supabase = createSupabaseAdmin();
    let query = supabase
      .from('areas')
      .select('id, name, code, is_active')
      .order('name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ areas: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'name y code requeridos' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('areas')
      .insert({ name, code, is_active: true })
      .select('id, name, code, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ area: data });
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
    const { id, name, code, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('areas')
      .update(updateData)
      .eq('id', id)
      .select('id, name, code, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ area: data });
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
    const areaId = searchParams.get('areaId');

    if (!areaId) {
      return NextResponse.json({ error: 'areaId requerido' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from('areas')
      .update({ is_active: false })
      .eq('id', areaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
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
    const areaId = searchParams.get('areaId');

    if (!areaId) {
      return NextResponse.json({ error: 'areaId requerido' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('inventories')
      .select('id, inventory_date, status, notes')
      .eq('area_id', areaId)
      .order('inventory_date', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
