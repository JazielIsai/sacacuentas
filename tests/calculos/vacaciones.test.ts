import { describe, expect, it } from 'vitest';
import { diasVacacionesLFT } from '@/data/ley';
import { calcularVacaciones } from '@/lib/calculos/vacaciones';

describe('tabla art. 76 LFT (vacaciones dignas)', () => {
  it.each([
    [0, 0], [1, 12], [2, 14], [3, 16], [4, 18], [5, 20],
    [6, 22], [10, 22], [11, 24], [15, 24], [16, 26], [20, 26], [21, 28], [26, 30], [31, 32],
  ])('año %i → %i días', (anio, dias) => {
    expect(diasVacacionesLFT(anio)).toBe(dias);
  });
});

describe('calcularVacaciones', () => {
  it('6 años cumplidos, $15,000 mensuales, prima 25%', () => {
    const r = calcularVacaciones({ fechaIngreso: '2020-03-01', fechaCorte: '2026-03-01', salario: 15000, periodicidad: 'mensual' });
    expect(r.aniosCumplidos).toBe(6);
    expect(r.diasVacaciones).toBe(22);
    expect(r.pagoVacaciones).toBe(11000);
    expect(r.primaVacacional).toBe(2750);
    expect(r.total).toBe(13750);
    expect(r.diasProximoAnio).toBe(22);
  });

  it('menos de un año: proporcionales y aviso', () => {
    const r = calcularVacaciones({ fechaIngreso: '2026-01-01', fechaCorte: '2026-07-01', salario: 15000, periodicidad: 'mensual' });
    expect(r.aniosCumplidos).toBe(0);
    expect(r.diasVacaciones).toBe(5.98); // 12 × 182 / 365
    expect(r.total).toBe(3737.5);
    expect(r.avisos.join(' ')).toMatch(/no cumples un año/);
  });

  it('prima mayor al mínimo', () => {
    const r = calcularVacaciones({ fechaIngreso: '2025-01-01', fechaCorte: '2026-01-01', salario: 500, periodicidad: 'diario', primaVacacional: 0.5 });
    expect(r.diasVacaciones).toBe(12);
    expect(r.primaVacacional).toBe(3000);
  });

  it('avisa si la prima es menor al 25%', () => {
    const r = calcularVacaciones({ fechaIngreso: '2025-01-01', fechaCorte: '2026-01-01', salario: 500, periodicidad: 'diario', primaVacacional: 0.1 });
    expect(r.avisos.join(' ')).toMatch(/25%/);
  });
});
