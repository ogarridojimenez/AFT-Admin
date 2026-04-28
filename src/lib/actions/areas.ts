'use server';

import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromCookies } from '@/lib/auth/getUser';
import { z } from 'zod';
import { invalidateCache } from '../api/cache';

const createAreaSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
});

export async function createArea(formData: FormData) {
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
    name: formData.get('name'),
    code: formData.get('code'),
  };

  const parsed = createAreaSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Datos inválidos');
  }

  const { data, error } = await supabase
    .from('areas')
    .insert({
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      is_active: true,
    })
    .select('id, name, code, is_active')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateCache('areas');
  return { area: data };
}

export async function updateArea(formData: FormData) {
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

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;

  if (!id || !name || !code) {
    throw new Error('Datos requeridos');
  }

  const { data, error } = await supabase
    .from('areas')
    .update({ name, code: code.toUpperCase() })
    .eq('id', id)
    .select('id, name, code, is_active')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateCache('areas');
  return { area: data };
}

export async function deactivateArea(areaId: string) {
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
    .from('areas')
    .update({ is_active: false })
    .eq('id', areaId);

  if (error) {
    throw new Error(error.message);
  }

  invalidateCache('areas');
  return { success: true };
}
