import { describe, expect, it } from 'vitest';
import { calcularAguinaldo } from '@/lib/calculos/aguinaldo';
import { vPrueba } from '../fixture';

describe('calcularAguinaldo', () => {
  it('año completo, $9,000 mensuales: 15 días, exento 30 UMA e ISR estimado', () => {
    const r = calcularAguinaldo(
      { salario: 9000, periodicidad: 'mensual', fechaIngreso: '2020-01-01', fechaCorte: '2026-12-31' },
      vPrueba,
    );
    expect(r.diasTrabajados).toBe(365);
    expect(r.diasAguinaldoProporcionales).toBe(15);
    expect(r.bruto).toBe(4500);
    expect(r.exento).toBe(3000); // 30 × $100
    expect(r.gravado).toBe(1500);
    // ISR(9,120 + 1,500) − ISR(9,120) = 838.36 − 675.16
    expect(r.isrEstimado).toBe(163.2);
    expect(r.neto).toBe(4336.8);
  });

  it('proporcional: entró el 1 de julio', () => {
    const r = calcularAguinaldo(
      { salario: 9000, periodicidad: 'mensual', fechaIngreso: '2026-07-01', fechaCorte: '2026-12-31' },
      vPrueba,
    );
    expect(r.diasTrabajados).toBe(184);
    expect(r.diasAguinaldoProporcionales).toBe(7.56); // 15 × 184 / 365
    expect(r.bruto).toBe(2268);
    expect(r.gravado).toBe(0);
    expect(r.isrEstimado).toBe(0);
  });

  it('año bisiesto: 366 días = aguinaldo completo', () => {
    const r = calcularAguinaldo(
      { salario: 300, periodicidad: 'diario', fechaIngreso: '2027-05-01', fechaCorte: '2028-12-31' },
      vPrueba,
    );
    expect(r.diasTrabajados).toBe(366);
    expect(r.diasAguinaldoProporcionales).toBe(15);
  });

  it('respeta días de aguinaldo superiores a la ley', () => {
    const r = calcularAguinaldo(
      { salario: 300, periodicidad: 'diario', fechaIngreso: '2020-01-01', fechaCorte: '2026-12-31', diasAguinaldo: 30 },
      vPrueba,
    );
    expect(r.bruto).toBe(9000);
  });

  it('rechaza salario cero', () => {
    expect(() =>
      calcularAguinaldo({ salario: 0, periodicidad: 'diario', fechaIngreso: '2020-01-01', fechaCorte: '2026-12-31' }, vPrueba),
    ).toThrow();
  });
});
