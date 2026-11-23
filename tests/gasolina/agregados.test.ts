import { describe, expect, it } from 'vitest';
import { historialDelDia, masBaratas, resumir } from '@/lib/gasolina/agregados';
import type { Estacion } from '@/lib/gasolina/tipos';

const est = (id: number, mun: string | null, precios: Estacion['precios'], nombre = `E${id}`): Estacion => ({ id, nombre, permiso: `P${id}`, lat: 25, lng: -100, mun, precios });
const datos = [
  est(1, '19039', { regular: 24, premium: 29 }),
  est(2, '19039', { regular: 23, diesel: 27 }),
  est(3, '19019', { regular: 25, premium: 30, diesel: 28 }),
  est(4, '09015', { regular: 22.5 }),
];

describe('agregados', () => {
  it('resume promedio, mínimo, máximo y conteo por combustible', () => {
    const r = resumir(datos);
    expect(r.regular).toEqual({ promedio: 23.63, min: 22.5, max: 25, n: 4 });
    expect(r.premium).toEqual({ promedio: 29.5, min: 29, max: 30, n: 2 });
    expect(r.diesel?.n).toBe(2);
  });

  it('las más baratas excluyen estaciones sin ese combustible', () => {
    expect(masBaratas(datos, 'diesel').map((e) => e.id)).toEqual([2, 3]);
    expect(masBaratas(datos, 'regular', 2).map((e) => e.id)).toEqual([4, 2]);
  });

  it('historial diario agrupa por estado y municipio', () => {
    const h = historialDelDia('2026-11-20', datos);
    expect(h.estados['19'].regular).toBe(24);
    expect(h.estados['09'].regular).toBe(22.5);
    expect(h.municipios['19039']).toEqual({ regular: 23.5, premium: 29, diesel: 27 });
    expect(h.nacional.regular).toBe(23.63);
  });
});
