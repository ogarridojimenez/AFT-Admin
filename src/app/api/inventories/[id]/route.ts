import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth/guard';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error: authError } = await requireAuth(request);
    if (authError) return authError;

    const inventoryId = params.id;
    const supabase = createSupabaseAdmin();

    // Verificar que el inventario existe
    const { data: inventory, error: invError } = await supabase
      .from('inventories')
      .select('id')
      .eq('id', inventoryId)
      .single();

    if (invError || !inventory) {
      return NextResponse.json({ error: 'Inventario no encontrado' }, { status: 404 });
    }

    // Eliminar inventory_items primero (porforeig key)
    const { error: itemsError } = await supabase
      .from('inventory_items')
      .delete()
      .eq('inventory_id', inventoryId);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Eliminar reconciliations
    const { error: reconError } = await supabase
      .from('reconciliations')
      .delete()
      .eq('inventory_id', inventoryId);

    if (reconError) {
      return NextResponse.json({ error: reconError.message }, { status: 500 });
    }

    // Eliminar inventario
    const { error: deleteError } = await supabase
      .from('inventories')
      .delete()
      .eq('id', inventoryId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}