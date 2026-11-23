import { describe, expect, it } from 'vitest';
import { getValores, PENDIENTES, ANIO_VIGENTE } from '@/data';

describe('valores por año', () => {
  it('el año vigente está configurado y es coherente', () => {
    const v = getValores();
    expect(v.anio).toBe(ANIO_VIGENTE);
    expect(v.uma.mensual).toBeCloseTo(v.uma.diaria * 30.4, 1);
    expect(v.salarioMinimo.frontera).toBeGreaterThan(v.salarioMinimo.general);
  });

  it('lanza error para un año sin configurar', () => {
    expect(() => getValores(1999)).toThrow();
  });

  // Recordatorio visible en cada corrida de pruebas mientras haya valores sin verificar.
  for (const p of PENDIENTES[ANIO_VIGENTE] ?? []) {
    it.todo(`VERIFICAR: ${p}`);
  }
});
