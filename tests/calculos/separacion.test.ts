import { describe, expect, it } from 'vitest';
import { calcularFiniquito, calcularLiquidacion } from '@/lib/calculos/separacion';
import { vPrueba } from '../fixture';

// Caso base: $15,000 mensuales (SD $500), del 16-ene-2023 al 30-jun-2026
// → 3 años y 166 días; 181 días trabajados en 2026; año de servicio en curso = 4.º (18 días).
const base = { salario: 15000, periodicidad: 'mensual' as const, fechaIngreso: '2023-01-16', fechaSalida: '2026-06-30' };

describe('calcularFiniquito', () => {
  it('renuncia con menos de 15 años: sin prima de antigüedad', () => {
    const r = calcularFiniquito({ ...base, motivo: 'renuncia' }, vPrueba);
    expect(r.conceptos.aguinaldo).toBe(3720); // 15 × 181/365 = 7.44 días
    expect(r.conceptos.vacaciones).toBe(4095); // 18 × 166/365 = 8.19 días
    expect(r.conceptos.primaVacacional).toBe(1023.75);
    expect(r.conceptos.primaAntiguedad).toBe(0);
    expect(r.total).toBe(8838.75);
  });

  it('despido justificado: incluye prima de antigüedad', () => {
    const r = calcularFiniquito({ ...base, motivo: 'despido-justificado' }, vPrueba);
    // 12 × 3.4548 = 41.46 días × $500
    expect(r.conceptos.primaAntiguedad).toBe(20730);
    expect(r.total).toBe(29568.75);
  });

  it('prima de antigüedad topada a 2 salarios mínimos', () => {
    const r = calcularFiniquito({ ...base, salario: 30000, motivo: 'despido-justificado' }, vPrueba);
    expect(r.conceptos.primaAntiguedad).toBe(24876); // 41.46 × $600
    const f = calcularFiniquito({ ...base, salario: 30000, motivo: 'despido-justificado', zona: 'frontera' }, vPrueba);
    expect(f.conceptos.primaAntiguedad).toBe(33168); // 41.46 × $800
  });

  it('renuncia con 15 años o más: sí hay prima de antigüedad', () => {
    const r = calcularFiniquito({ ...base, fechaIngreso: '2011-06-30', motivo: 'renuncia' }, vPrueba);
    expect(r.conceptos.primaAntiguedad).toBeGreaterThan(0);
  });

  it('suma salario pendiente y vacaciones no disfrutadas; omite aguinaldo ya pagado', () => {
    const r = calcularFiniquito(
      { ...base, motivo: 'renuncia', diasSalarioPendiente: 10, vacacionesPendientes: 4, aguinaldoPagado: true },
      vPrueba,
    );
    expect(r.conceptos.salarioPendiente).toBe(5000);
    expect(r.conceptos.aguinaldo).toBe(0);
    expect(r.conceptos.vacaciones).toBe(6095); // (8.19 + 4) × 500
  });
});

describe('calcularLiquidacion', () => {
  it('sin salario integrado ni 20 días: finiquito + 90 días', () => {
    const r = calcularLiquidacion({ ...base, usarSalarioIntegrado: false }, vPrueba);
    expect(r.indemnizacion3Meses).toBe(45000);
    expect(r.indemnizacion20Dias).toBe(0);
    expect(r.total).toBe(74568.75);
  });

  it('con salario integrado y 20 días por año', () => {
    const r = calcularLiquidacion({ ...base, incluir20Dias: true }, vPrueba);
    // factor = 1 + (15 + 18 × 0.25)/365 → SDI = 526.71
    expect(r.salarioIntegrado).toBe(526.71);
    expect(r.indemnizacion3Meses).toBe(47403.9);
    expect(r.finiquito.conceptos.primaAntiguedad).toBe(21837.4);
    expect(r.indemnizacion20Dias).toBe(36395.66); // 69.10 días
    expect(r.total).toBe(114475.71);
  });
});
