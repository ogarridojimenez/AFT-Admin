'use server';

import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromCookies } from '@/lib/auth/getUser';
import { z } from 'zod';
import { invalidateCache } from '../api/cache';

const createInventorySchema = z.object({
  area_id: z.string().uuid(),
  inventory_date: z.string().min(1),
  notes: z.string().optional(),
});

export async function createInventory(formData: FormData) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error('No autorizado');
  }

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  
  if (profile?.role !== 'admin') {
    throw new Error('Se requiere rol administrador');
  }

  const rawData = {
    area_id: formData.get('area_id'),
    inventory_date: formData.get('inventory_date'),
    notes: formData.get('notes') || undefined,
  };

  const parsed = createInventorySchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Datos inválidos');
  }

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
    throw new Error(error.message);
  }

  invalidateCache('inventories');
  return { id: data.id };
}

export async function deleteInventory(id: string) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error('No autorizado');
  }

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  
  if (profile?.role !== 'admin') {
    throw new Error('Se requiere rol administrador');
  }

  const { error } = await supabase
    .from('inventories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  invalidateCache('inventories');
  return { success: true };
}