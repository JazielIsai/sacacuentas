import { describe, expect, it } from 'vitest';
import { antiguedad, diasInclusivos, parseFecha, r2, salarioDiario, sumarAnios } from '@/lib/calculos/comunes';

describe('comunes', () => {
  it('redondea a centavos sin errores de flotante', () => {
    expect(r2(1.005)).toBe(1.01);
    expect(r2(0.1 + 0.2)).toBe(0.3);
  });

  it('salario diario según art. 89 LFT', () => {
    expect(salarioDiario(15000, 'mensual')).toBe(500);
    expect(salarioDiario(3500, 'semanal')).toBe(500);
    expect(salarioDiario(7500, 'quincenal')).toBe(500);
  });

  it('cuenta días inclusivos', () => {
    expect(diasInclusivos(parseFecha('2026-01-01'), parseFecha('2026-12-31'))).toBe(365);
    expect(diasInclusivos(parseFecha('2028-01-01'), parseFecha('2028-12-31'))).toBe(366);
  });

  it('rechaza fechas inválidas', () => {
    expect(() => parseFecha('2026-02-30')).toThrow();
    expect(() => parseFecha('30/01/2026')).toThrow();
  });

  it('29 de febrero → 28 de febrero en año no bisiesto', () => {
    expect(sumarAnios(parseFecha('2024-02-29'), 1).toISOString().slice(0, 10)).toBe('2025-02-28');
  });

  it('antigüedad: el último día del año completo cuenta como año cumplido', () => {
    const a = antiguedad(parseFecha('2020-03-01'), parseFecha('2026-02-28'));
    expect(a.aniosCompletos).toBe(6);
    expect(a.diasDesdeAniversario).toBe(0);
    const b = antiguedad(parseFecha('2020-03-01'), parseFecha('2026-02-27'));
    expect(b.aniosCompletos).toBe(5);
    expect(b.diasDesdeAniversario).toBe(364);
  });

  it('antigüedad: error si la salida es anterior al ingreso', () => {
    expect(() => antiguedad(parseFecha('2026-01-02'), parseFecha('2026-01-01'))).toThrow();
  });
});
