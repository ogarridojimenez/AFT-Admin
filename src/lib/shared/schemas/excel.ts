import { z } from 'zod';
import { ASSET_ID_REGEX } from '../constants/assetId';

const str = z.preprocess((v) => (v == null || v === '' ? undefined : String(v)), z.string());

function extractName(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  const s = String(v).trim();
  return s.split(':')[0] || s;
}

export const excelRowSchema = z.object({
  asset_id: z.preprocess(
    (v) => (v == null ? '' : String(v).trim().toUpperCase()),
    z.string().regex(ASSET_ID_REGEX, {
      message: 'ID de activo debe seguir el formato MB seguido de 5 o más dígitos',
    })
  ),
  serial_number: z.preprocess(
    (v) => (v == null || v === '' ? undefined : String(v).trim()),
    str.optional()
  ),
  name: z.preprocess(extractName, z.string().min(1)),
  description: z.preprocess((v) => (v == null || v === '' ? undefined : String(v).trim()), str.optional()),
  category: str.optional(),
  brand: str.optional(),
  model: str.optional(),
  purchase_date: z.unknown().optional(),
  purchase_value: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().nonnegative().optional()
  ),
  location: str.optional(),
  area_code: z.preprocess((v) => (v == null ? '' : String(v).trim()), z.string().min(1)),
});

export type ExcelRowInput = z.infer<typeof excelRowSchema>;