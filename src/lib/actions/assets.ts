'use server';

import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromCookies } from '@/lib/auth/getUser';
import { z } from 'zod';
import { invalidateCache } from '../api/cache';

const updateAssetSchema = z.object({
  asset_id: z.string(),
  name: z.string().optional(),
  status: z.enum(['active', 'inactive', 'retired']).optional(),
  area_id: z.string().uuid().optional().nullable(),
});

export async function updateAsset(formData: FormData) {
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
    asset_id: formData.get('asset_id'),
    name: formData.get('name') || undefined,
    status: formData.get('status') || undefined,
    area_id: formData.get('area_id') || undefined,
  };

  const parsed = updateAssetSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Datos inválidos');
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.area_id !== undefined) updateData.area_id = parsed.data.area_id === '' ? null : parsed.data.area_id;

  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('asset_id', parsed.data.asset_id)
    .select('asset_id, name, status, areas(id, code, name)')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateCache('assets');
  return { asset: data };
}

export async function deleteAsset(assetId: string) {
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
    .from('assets')
    .delete()
    .eq('asset_id', assetId);

  if (error) {
    throw new Error(error.message);
  }

  invalidateCache('assets');
  return { success: true };
}
