import { describe, expect, it } from 'vitest';
import { getValores } from '@/data';
import { calcularSueldoNeto } from '@/lib/calculos/sueldo-neto';

const v = getValores(2026);

describe('calcularSueldoNeto', () => {
  it('$20,000 mensuales, primer año', () => {
    const r = calcularSueldoNeto({ ingreso: 20000, periodo: 'mensual' }, v);
    // ISR: (20,000 − 17,533.65) × 21.36% + 1,856.84 = 2,383.65
    expect(r.isr).toBe(2383.65);
    // SD 666.67 × (1 + 18/365) = 699.55
    expect(r.sbc).toBe(699.55);
    // 30.4 días: excedente (699.55 − 351.93) × 0.40% = 42.27; 53.17; 79.75; 132.91; 239.25
    expect(r.imss).toBe(547.35);
    expect(r.neto).toBe(17069);
  });
  it('debajo de 3 UMA no hay cuota por excedente', () => {
    const r = calcularSueldoNeto({ ingreso: 10000, periodo: 'mensual' }, v);
    expect(r.sbc).toBe(349.77);
    expect(r.pasos.some((p) => p.etiqueta.includes('excedente de 3'))).toBe(false);
  });
  it('salario mínimo: sin ISR ni IMSS', () => {
    expect(calcularSueldoNeto({ ingreso: 4725.6, periodo: 'quincenal' }, v).neto).toBe(4725.6);
    expect(calcularSueldoNeto({ ingreso: 13409.8, periodo: 'mensual', zona: 'frontera' }, v).imss).toBe(0);
  });
  it('topa el salario base en 25 UMA', () => {
    expect(calcularSueldoNeto({ ingreso: 200000, periodo: 'mensual' }, v).sbc).toBe(2932.75);
  });
  it('resta otros descuentos y valida entradas', () => {
    const a = calcularSueldoNeto({ ingreso: 20000, periodo: 'mensual' }, v);
    expect(calcularSueldoNeto({ ingreso: 20000, periodo: 'mensual', otrosDescuentos: 1000 }, v).neto).toBe(a.neto - 1000);
    expect(() => calcularSueldoNeto({ ingreso: 20000, periodo: 'mensual', otrosDescuentos: 50000 }, v)).toThrow();
    expect(() => calcularSueldoNeto({ ingreso: 20000, periodo: 'mensual', antiguedad: NaN }, v)).toThrow();
    expect(() => calcularSueldoNeto({ ingreso: 20000, periodo: 'mensual', diasAguinaldo: 5 }, v)).toThrow();
  });
});
