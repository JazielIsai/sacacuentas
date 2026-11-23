import type { ValoresAnuales } from './tipos';
import { valores2026, PENDIENTES_2026 } from './valores-2026';

/**
 * Registro de valores por año. Para agregar 2027:
 * 1. Copia `valores-2026.ts` a `valores-2027.ts` y actualiza cada valor con su fuente.
 * 2. Regístralo aquí y cambia `ANIO_VIGENTE`.
 */
const REGISTRO: Record<number, ValoresAnuales> = {
  2026: valores2026,
};

export const ANIO_VIGENTE = 2026;

export const PENDIENTES: Record<number, string[]> = {
  2026: PENDIENTES_2026,
};

export function getValores(anio: number = ANIO_VIGENTE): ValoresAnuales {
  const v = REGISTRO[anio];
  if (!v) throw new Error(`No hay valores configurados para ${anio}`);
  return v;
}

export type { ValoresAnuales, RenglonISR } from './tipos';
