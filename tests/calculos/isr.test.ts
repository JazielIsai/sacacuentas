import { describe, expect, it } from 'vitest';
import { buscarRenglon, calcularISR, isrTarifa, tarifaPara } from '@/lib/calculos/isr';
import { vPrueba } from '../fixture';

const tarifa = vPrueba.isr.tarifaMensual;

describe('tarifa art. 96', () => {
  it('es continua: cada límite inferior = superior anterior + 0.01', () => {
    for (let i = 1; i < tarifa.length; i++) {
      expect(tarifa[i].limiteInferior).toBeCloseTo(tarifa[i - 1].limiteSuperior + 0.01, 2);
    }
  });

  it('busca el renglón correcto en los bordes', () => {
    expect(buscarRenglon(746.04, tarifa).porcentaje).toBe(1.92);
    expect(buscarRenglon(746.05, tarifa).porcentaje).toBe(6.4);
    expect(buscarRenglon(1_000_000, tarifa).porcentaje).toBe(35);
  });

  it('ISR mensual de $20,000 (sin subsidio)', () => {
    // (20,000 − 15,487.72) × 21.36% + 1,640.18
    expect(isrTarifa(20000, tarifa).isr).toBe(2604);
  });
});

describe('calcularISR', () => {
  it('$20,000 mensuales: sin subsidio', () => {
    const r = calcularISR({ ingreso: 20000, periodo: 'mensual' }, vPrueba);
    expect(r.isrAntesSubsidio).toBe(2604);
    expect(r.subsidio).toBe(0);
    expect(r.neto).toBe(17396);
  });

  it('$8,000 mensuales: con subsidio (13.8% × $3,040 = $419.52)', () => {
    const r = calcularISR({ ingreso: 8000, periodo: 'mensual' }, vPrueba);
    expect(r.isrAntesSubsidio).toBe(553.3);
    expect(r.subsidio).toBe(419.52);
    expect(r.isrRetenido).toBe(133.78);
    expect(r.neto).toBe(7866.22);
  });

  it('$5,000 mensuales: subsidio mayor al ISR → retención 0, sin saldo a favor', () => {
    const r = calcularISR({ ingreso: 5000, periodo: 'mensual' }, vPrueba);
    expect(r.isrAntesSubsidio).toBe(286.57);
    expect(r.isrRetenido).toBe(0);
    expect(r.neto).toBe(5000);
  });

  it('$10,000 quincenales con tarifa derivada (× 15/30.4)', () => {
    const q = tarifaPara('quincenal', tarifa);
    expect(buscarRenglon(10000, q).limiteInferior).toBe(7641.97);
    const r = calcularISR({ ingreso: 10000, periodo: 'quincenal' }, vPrueba);
    expect(r.isrAntesSubsidio).toBe(1312.98);
    expect(r.subsidio).toBe(0);
  });
});
