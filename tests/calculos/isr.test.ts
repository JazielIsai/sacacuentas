import { describe, expect, it } from 'vitest';
import { buscarRenglon, calcularISR, isrTarifa } from '@/lib/calculos/isr';
import { getValores } from '@/data';
import { vPrueba } from '../fixture';

const tarifa = vPrueba.isr.tarifas.mensual;

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
    const r = calcularISR({ ingreso: 8000, periodo: 'mensual' }, { ...vPrueba, salarioMinimo: { general: 200, frontera: 300 } });
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

  it('$12,000 mensuales con la tarifa 2026, sin subsidio', () => {
    // (12,000 − 7,168.52) × 10.88% + 420.95 = 946.615
    expect(calcularISR({ ingreso: 12000, periodo: 'mensual' }, getValores(2026)).isrRetenido).toBe(946.62);
  });

  it('$10,000 quincenales con la tarifa oficial de 15 días', () => {
    // (10,000 − 8,651.41) × 21.36% + 916.20
    expect(calcularISR({ ingreso: 10000, periodo: 'quincenal' }, getValores(2026)).isrRetenido).toBe(1204.26);
  });

  it('subsidio 2026 = 15.02% × UMA mensual = $535.65, hasta $11,492.66', () => {
    const v = getValores(2026);
    expect(calcularISR({ ingreso: 11492.66, periodo: 'mensual' }, v).subsidio).toBe(535.65);
    expect(calcularISR({ ingreso: 11492.67, periodo: 'mensual' }, v).subsidio).toBe(0);
  });

  it('no se retiene a quien solo gana el salario mínimo de su zona (art. 96)', () => {
    const v = getValores(2026);
    expect(calcularISR({ ingreso: 9582.47, periodo: 'mensual' }, v).isrRetenido).toBe(0);
    expect(calcularISR({ ingreso: 9700, periodo: 'mensual' }, v).isrRetenido).toBeGreaterThan(0);
    expect(calcularISR({ ingreso: 13409.8, periodo: 'mensual', zona: 'frontera' }, v).isrRetenido).toBe(0);
    expect(calcularISR({ ingreso: 13409.8, periodo: 'mensual' }, v).isrRetenido).toBeGreaterThan(0);
  });

  it.each(['diario', 'semanal', 'quincenal', 'mensual'] as const)('tarifa oficial %s: 11 renglones y continua', (p) => {
    const f = getValores(2026).isr.tarifas[p];
    expect(f).toHaveLength(11);
    for (let k = 1; k < f.length; k++) expect(f[k].limiteInferior).toBeCloseTo(f[k - 1].limiteSuperior + 0.01, 2);
  });
});
